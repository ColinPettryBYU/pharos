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

        var monthlyTrends = donations
            .GroupBy(d => d.DonationDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var monetaryAmt = g.Where(d => d.DonationType == "Monetary" && d.Amount.HasValue).Sum(d => d.Amount!.Value);
                var inKindAmt = g.Where(d => d.DonationType != "Monetary" && d.Amount.HasValue).Sum(d => d.Amount!.Value);
                var recurringAmt = g.Where(d => d.IsRecurring && d.Amount.HasValue).Sum(d => d.Amount!.Value);
                var total = g.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value);
                return new MonthlyDonationTrendDto(
                    g.Key, total, g.Count(),
                    monetaryAmt, inKindAmt, recurringAmt, total - recurringAmt);
            });

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
        var allHealthRecords = await _db.HealthWellbeingRecords.ToListAsync();
        var allEducationRecords = await _db.EducationRecords.ToListAsync();
        var allProcessRecordings = await _db.ProcessRecordings.ToListAsync();
        var allInterventionPlans = await _db.InterventionPlans.ToListAsync();

        var latestHealth = allHealthRecords
            .GroupBy(h => h.ResidentId)
            .Select(g => g.OrderByDescending(h => h.RecordDate).First())
            .ToList();
        var latestEducation = allEducationRecords
            .GroupBy(e => e.ResidentId)
            .Select(g => g.OrderByDescending(e => e.RecordDate).First())
            .ToList();

        var riskBreakdown = residents
            .Where(r => r.CurrentRiskLevel != null)
            .GroupBy(r => r.CurrentRiskLevel!)
            .Select(g => new RiskLevelBreakdownDto(g.Key, g.Count()));

        var reintegrationBreakdown = residents
            .Where(r => r.ReintegrationStatus != null)
            .GroupBy(r => r.ReintegrationStatus!)
            .Select(g => new ReintegrationBreakdownDto(g.Key, g.Count()));

        var educationProgress = allEducationRecords
            .Where(e => e.ProgressPercent.HasValue)
            .GroupBy(e => e.RecordDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new MonthlyProgressDto(g.Key, (decimal)g.Average(e => e.ProgressPercent!.Value)));

        var healthTrends = allHealthRecords
            .GroupBy(h => h.RecordDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new MonthlyProgressDto(g.Key, (decimal)g.Average(h => h.GeneralHealthScore)));

        var emotionalDistribution = allProcessRecordings
            .Where(p => p.EmotionalStateObserved != null)
            .GroupBy(p => p.EmotionalStateObserved!)
            .Select(g => new NameCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count);

        var interventionCompletion = allInterventionPlans
            .GroupBy(p => p.PlanCategory)
            .Select(g => new InterventionCompletionDto(
                g.Key,
                g.Count(p => p.Status == "Achieved" || p.Status == "Closed"),
                g.Count()));

        return new OutcomesReportDto(
            residents.Count,
            residents.Count(r => r.CaseStatus == "Active"),
            residents.Count(r => r.ReintegrationStatus == "Completed"),
            riskBreakdown, reintegrationBreakdown,
            latestHealth.Count > 0 ? (decimal)latestHealth.Average(h => h.GeneralHealthScore) : 0,
            latestEducation.Where(e => e.ProgressPercent.HasValue).Select(e => e.ProgressPercent!.Value).DefaultIfEmpty(0).Average(),
            educationProgress, healthTrends, emotionalDistribution, interventionCompletion);
    }

    public async Task<SafehouseReportResponseDto> GetSafehouseReportAsync()
    {
        var safehouses = await _db.Safehouses
            .Include(s => s.Residents)
            .Include(s => s.MonthlyMetrics)
            .Include(s => s.IncidentReports)
            .ToListAsync();

        var safehouseList = safehouses.Select(s =>
        {
            var latestMetric = s.MonthlyMetrics.OrderByDescending(m => m.MonthStart).FirstOrDefault();
            var activeResidents = s.Residents.Count(r => r.CaseStatus == "Active");
            return new SafehouseReportDto(
                s.SafehouseId, s.Name, activeResidents, s.CapacityGirls,
                s.CapacityGirls > 0 ? (decimal)activeResidents / s.CapacityGirls * 100 : 0,
                latestMetric?.AvgHealthScore, latestMetric?.AvgEducationProgress,
                latestMetric?.IncidentCount ?? 0,
                latestMetric?.ProcessRecordingCount ?? 0,
                latestMetric?.HomeVisitationCount ?? 0);
        });

        var monthlyMetrics = safehouses.SelectMany(s =>
            s.MonthlyMetrics.Select(m => new SafehouseMonthlyMetricSummaryDto(
                s.SafehouseId, s.Name, m.MonthStart,
                m.ActiveResidents, m.AvgEducationProgress, m.AvgHealthScore,
                m.ProcessRecordingCount, m.HomeVisitationCount, m.IncidentCount)))
            .OrderBy(m => m.MonthStart);

        return new SafehouseReportResponseDto(safehouseList, monthlyMetrics);
    }

    public async Task<SocialMediaReportDto> GetSocialMediaReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.SocialMediaPosts.AsQueryable();
        if (from.HasValue) query = query.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(p => p.CreatedAt <= to.Value);

        var posts = await query.ToListAsync();
        if (!posts.Any())
            return new SocialMediaReportDto(0, 0, 0, 0, null, null, null, null, null,
                Enumerable.Empty<ReportPlatformBreakdownDto>(),
                Enumerable.Empty<PostTypePerformanceDto>(),
                Enumerable.Empty<EngagementTrendDto>(),
                Enumerable.Empty<DonationAttributionDto>());

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

        var platformBreakdown = posts.GroupBy(p => p.Platform)
            .Select(g => new ReportPlatformBreakdownDto(
                g.Key, g.Count(),
                g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
                g.Sum(p => p.DonationReferrals ?? 0)))
            .OrderByDescending(x => x.PostCount);

        var postTypePerformance = posts.GroupBy(p => p.PostType)
            .Select(g => new PostTypePerformanceDto(
                g.Key, g.Count(),
                g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
                g.Sum(p => p.DonationReferrals ?? 0)))
            .OrderByDescending(x => x.AvgEngagement);

        var engagementTrends = posts
            .GroupBy(p => p.CreatedAt.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new EngagementTrendDto(
                g.Key,
                g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
                g.Count()));

        var donationAttribution = posts
            .Where(p => (p.DonationReferrals ?? 0) > 0)
            .GroupBy(p => p.Platform)
            .Select(g => new DonationAttributionDto(
                g.Key,
                g.Sum(p => p.DonationReferrals ?? 0),
                g.Sum(p => p.EstimatedDonationValuePhp ?? 0)))
            .OrderByDescending(x => x.Referrals);

        return new SocialMediaReportDto(
            posts.Count,
            posts.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
            posts.Sum(p => p.DonationReferrals ?? 0),
            posts.Sum(p => p.EstimatedDonationValuePhp ?? 0),
            bestPlatform, bestPostType, bestTopic, bestHour, bestDay,
            platformBreakdown, postTypePerformance, engagementTrends, donationAttribution);
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
