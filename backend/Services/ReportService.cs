using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public class ReportService : IReportService
{
    private readonly PharosDbContext _db;

    public ReportService(PharosDbContext db) => _db = db;

    public async Task<DonationReportDto> GetDonationReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.Donations.AsQueryable();
        if (from.HasValue) query = query.Where(d => d.DonationDate >= from.Value);
        if (to.HasValue) query = query.Where(d => d.DonationDate <= to.Value);

        var donations = await query.ToListAsync();
        var monetary = donations.Where(d => d.Amount.HasValue).ToList();

        var monthlyTrends = monetary
            .GroupBy(d => d.DonationDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new MonthlyDonationTrendDto(g.Key, g.Sum(d => d.Amount!.Value), g.Count()));

        var campaigns = monetary
            .Where(d => d.CampaignName != null)
            .GroupBy(d => d.CampaignName!)
            .Select(g => new CampaignSummaryDto(g.Key, g.Sum(d => d.Amount!.Value), g.Count()));

        var channels = monetary
            .GroupBy(d => d.ChannelSource)
            .Select(g => new ChannelSummaryDto(g.Key, g.Sum(d => d.Amount!.Value), g.Count()));

        return new DonationReportDto(
            monetary.Sum(d => d.Amount!.Value),
            donations.Count,
            monetary.Count > 0 ? monetary.Average(d => d.Amount!.Value) : 0,
            donations.Where(d => d.IsRecurring).Select(d => d.SupporterId).Distinct().Count(),
            monthlyTrends, campaigns, channels);
    }

    public async Task<OutcomesReportDto> GetOutcomesReportAsync()
    {
        var residents = await _db.Residents.ToListAsync();
        var healthRecords = await _db.HealthWellbeingRecords
            .GroupBy(h => h.ResidentId)
            .Select(g => g.OrderByDescending(h => h.RecordDate).First())
            .ToListAsync();
        var educationRecords = await _db.EducationRecords
            .GroupBy(e => e.ResidentId)
            .Select(g => g.OrderByDescending(e => e.RecordDate).First())
            .ToListAsync();

        var riskBreakdown = residents
            .Where(r => r.CurrentRiskLevel != null)
            .GroupBy(r => r.CurrentRiskLevel!)
            .Select(g => new RiskLevelBreakdownDto(g.Key, g.Count()));

        var reintegrationBreakdown = residents
            .Where(r => r.ReintegrationStatus != null)
            .GroupBy(r => r.ReintegrationStatus!)
            .Select(g => new ReintegrationBreakdownDto(g.Key, g.Count()));

        return new OutcomesReportDto(
            residents.Count,
            residents.Count(r => r.CaseStatus == "Active"),
            residents.Count(r => r.ReintegrationStatus == "Completed"),
            riskBreakdown, reintegrationBreakdown,
            healthRecords.Count > 0 ? healthRecords.Average(h => h.GeneralHealthScore) : 0,
            educationRecords.Where(e => e.ProgressPercent.HasValue).Select(e => e.ProgressPercent!.Value).DefaultIfEmpty(0).Average());
    }

    public async Task<IEnumerable<SafehouseReportDto>> GetSafehouseReportAsync()
    {
        var safehouses = await _db.Safehouses
            .Include(s => s.Residents)
            .Include(s => s.MonthlyMetrics.OrderByDescending(m => m.MonthStart).Take(1))
            .Include(s => s.IncidentReports)
            .ToListAsync();

        return safehouses.Select(s =>
        {
            var latestMetric = s.MonthlyMetrics.FirstOrDefault();
            var activeResidents = s.Residents.Count(r => r.CaseStatus == "Active");
            return new SafehouseReportDto(
                s.SafehouseId, s.Name, activeResidents, s.CapacityGirls,
                s.CapacityGirls > 0 ? (decimal)activeResidents / s.CapacityGirls * 100 : 0,
                latestMetric?.AvgHealthScore, latestMetric?.AvgEducationProgress,
                latestMetric?.IncidentCount ?? 0,
                latestMetric?.ProcessRecordingCount ?? 0,
                latestMetric?.HomeVisitationCount ?? 0);
        });
    }

    public async Task<SocialMediaReportDto> GetSocialMediaReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.SocialMediaPosts.AsQueryable();
        if (from.HasValue) query = query.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(p => p.CreatedAt <= to.Value);

        var posts = await query.ToListAsync();
        if (!posts.Any())
            return new SocialMediaReportDto(0, 0, 0, 0, null, null, null, null, null);

        var bestPlatform = posts.GroupBy(p => p.Platform)
            .OrderByDescending(g => g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())
            .FirstOrDefault()?.Key;

        var bestPostType = posts.GroupBy(p => p.PostType)
            .OrderByDescending(g => g.Sum(p => p.DonationReferrals ?? 0))
            .FirstOrDefault()?.Key;

        var bestTopic = posts.Where(p => p.ContentTopic != null).GroupBy(p => p.ContentTopic!)
            .OrderByDescending(g => g.Sum(p => p.DonationReferrals ?? 0))
            .FirstOrDefault()?.Key;

        var bestHour = posts.Where(p => p.PostHour.HasValue).GroupBy(p => p.PostHour!.Value)
            .OrderByDescending(g => g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())
            .FirstOrDefault()?.Key;

        var bestDay = posts.Where(p => p.DayOfWeek != null).GroupBy(p => p.DayOfWeek!)
            .OrderByDescending(g => g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())
            .FirstOrDefault()?.Key;

        return new SocialMediaReportDto(
            posts.Count,
            posts.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
            posts.Sum(p => p.DonationReferrals ?? 0),
            posts.Sum(p => p.EstimatedDonationValuePhp ?? 0),
            bestPlatform, bestPostType, bestTopic, bestHour, bestDay);
    }

    public async Task<PagedResult<PublicImpactSnapshotDto>> GetImpactSnapshotsAsync(int page, int pageSize)
    {
        var query = _db.PublicImpactSnapshots.Where(s => s.IsPublished);
        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(s => s.SnapshotDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new PublicImpactSnapshotDto(s.SnapshotId, s.SnapshotDate, s.Headline, s.SummaryText, s.MetricPayloadJson, s.IsPublished, s.PublishedAt))
            .ToListAsync();

        return new PagedResult<PublicImpactSnapshotDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<PublicImpactSnapshotDto?> GetImpactSnapshotByIdAsync(int id)
    {
        var s = await _db.PublicImpactSnapshots.FirstOrDefaultAsync(x => x.SnapshotId == id && x.IsPublished);
        if (s == null) return null;
        return new PublicImpactSnapshotDto(s.SnapshotId, s.SnapshotDate, s.Headline, s.SummaryText, s.MetricPayloadJson, s.IsPublished, s.PublishedAt);
    }
}
