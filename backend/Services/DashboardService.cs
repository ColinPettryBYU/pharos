using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public class DashboardService : IDashboardService
{
    private readonly PharosDbContext _db;
    private readonly IMLService _ml;

    public DashboardService(PharosDbContext db, IMLService ml)
    {
        _db = db;
        _ml = ml;
    }

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonthStart = thisMonthStart.AddMonths(-1);
        var thirtyDaysAgo = now.AddDays(-30);

        var stats = await BuildStatsAsync(thisMonthStart, lastMonthStart, thirtyDaysAgo);
        var donationTrends = await BuildDonationTrendsAsync();
        var occupancy = await BuildOccupancyAsync();
        var activity = await BuildActivityFeedAsync();
        var alerts = await BuildRiskAlertsAsync();

        return new DashboardDto(stats, donationTrends, occupancy, activity, alerts);
    }

    private async Task<DashboardStatsDto> BuildStatsAsync(DateTime thisMonthStart, DateTime lastMonthStart, DateTime thirtyDaysAgo)
    {
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");

        var latestDonation = await _db.Donations
            .Where(d => d.Amount.HasValue || d.EstimatedValue.HasValue)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => d.DonationDate)
            .FirstOrDefaultAsync();

        var effectiveMonthStart = latestDonation != default
            ? new DateTime(latestDonation.Year, latestDonation.Month, 1, 0, 0, 0, DateTimeKind.Utc)
            : thisMonthStart;
        var prevMonthStart = effectiveMonthStart.AddMonths(-1);
        var effectiveMonthEnd = effectiveMonthStart.AddMonths(1);

        var recentDonations = await _db.Donations
            .Where(d => d.DonationDate >= effectiveMonthStart && d.DonationDate < effectiveMonthEnd)
            .ToListAsync();
        var thisMonthDonations = recentDonations.Sum(d => d.Amount ?? d.EstimatedValue ?? 0);

        var prevDonations = await _db.Donations
            .Where(d => d.DonationDate >= prevMonthStart && d.DonationDate < effectiveMonthStart)
            .ToListAsync();
        var lastMonthDonations = prevDonations.Sum(d => d.Amount ?? d.EstimatedValue ?? 0);

        var donationChange = lastMonthDonations > 0
            ? Math.Round((thisMonthDonations - lastMonthDonations) / lastMonthDonations * 100, 1)
            : 0;

        var casesNeedingReview = await _db.ProcessRecordings
            .Where(pr => pr.SessionDate >= thirtyDaysAgo && pr.ConcernsFlagged != null && pr.ConcernsFlagged != "")
            .Select(pr => pr.ResidentId)
            .Distinct()
            .CountAsync();

        var thisMonthRates = await _db.SocialMediaPosts
            .Where(p => p.CreatedAt >= thisMonthStart && p.EngagementRate.HasValue)
            .Select(p => p.EngagementRate!.Value)
            .ToListAsync();
        var thisMonthEngagement = thisMonthRates.Count > 0 ? thisMonthRates.Average() : 0m;

        var lastMonthRates = await _db.SocialMediaPosts
            .Where(p => p.CreatedAt >= lastMonthStart && p.CreatedAt < thisMonthStart && p.EngagementRate.HasValue)
            .Select(p => p.EngagementRate!.Value)
            .ToListAsync();
        var lastMonthEngagement = lastMonthRates.Count > 0 ? lastMonthRates.Average() : 0m;

        var engagementChange = lastMonthEngagement > 0
            ? Math.Round((thisMonthEngagement - lastMonthEngagement) / lastMonthEngagement * 100, 1)
            : 0;

        return new DashboardStatsDto(
            activeResidents, thisMonthDonations, donationChange,
            casesNeedingReview, thisMonthEngagement, engagementChange);
    }

    private async Task<IEnumerable<MonthlyDonationTrendDto>> BuildDonationTrendsAsync()
    {
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var donations = await _db.Donations
            .Where(d => d.DonationDate >= sixMonthsAgo && (d.Amount.HasValue || d.EstimatedValue.HasValue))
            .ToListAsync();

        decimal eff(Models.Donation d) => d.Amount ?? d.EstimatedValue ?? 0;

        return donations
            .GroupBy(d => d.DonationDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var total = g.Sum(d => eff(d));
                var monetaryAmt = g.Where(d => d.DonationType == "Monetary").Sum(d => eff(d));
                var inKindAmt = g.Where(d => d.DonationType == "InKind").Sum(d => eff(d));
                var recurringAmt = g.Where(d => d.IsRecurring).Sum(d => eff(d));
                return new MonthlyDonationTrendDto(g.Key, total, g.Count(), monetaryAmt, inKindAmt, recurringAmt, total - recurringAmt);
            });
    }

    private async Task<IEnumerable<SafehouseOccupancyDto>> BuildOccupancyAsync()
    {
        return await _db.Safehouses
            .Where(s => s.Status == "Active")
            .Select(s => new SafehouseOccupancyDto(
                s.SafehouseId,
                s.Name,
                s.CurrentOccupancy,
                s.CapacityGirls,
                s.CapacityGirls > 0
                    ? Math.Round((decimal)s.CurrentOccupancy / s.CapacityGirls * 100, 1)
                    : 0))
            .ToListAsync();
    }

    private async Task<IEnumerable<ActivityFeedItemDto>> BuildActivityFeedAsync()
    {
        var cutoff = DateTime.UtcNow.AddDays(-30);

        var donationActivity = await _db.Donations
            .Where(d => d.DonationDate >= cutoff)
            .OrderByDescending(d => d.DonationDate)
            .Take(10)
            .Select(d => new ActivityFeedItemDto(
                "Donation",
                $"₱{(d.Amount ?? 0):N2} {d.DonationType} donation received",
                d.DonationDate,
                d.DonationId))
            .ToListAsync();

        var sessionActivity = await _db.ProcessRecordings
            .Where(pr => pr.SessionDate >= cutoff)
            .OrderByDescending(pr => pr.SessionDate)
            .Take(10)
            .Select(pr => new ActivityFeedItemDto(
                "Session",
                $"{pr.SessionType} session with resident #{pr.ResidentId}",
                pr.SessionDate,
                pr.RecordingId))
            .ToListAsync();

        var incidentActivity = await _db.IncidentReports
            .Where(ir => ir.IncidentDate >= cutoff)
            .OrderByDescending(ir => ir.IncidentDate)
            .Take(10)
            .Select(ir => new ActivityFeedItemDto(
                "Incident",
                $"{ir.Severity} {ir.IncidentType} incident reported",
                ir.IncidentDate,
                ir.IncidentId))
            .ToListAsync();

        var visitActivity = await _db.HomeVisitations
            .Where(hv => hv.VisitDate >= cutoff)
            .OrderByDescending(hv => hv.VisitDate)
            .Take(10)
            .Select(hv => new ActivityFeedItemDto(
                "Visit",
                $"{hv.VisitType} home visit — {hv.VisitOutcome}",
                hv.VisitDate,
                hv.VisitationId))
            .ToListAsync();

        return donationActivity
            .Concat(sessionActivity)
            .Concat(incidentActivity)
            .Concat(visitActivity)
            .OrderByDescending(a => a.Timestamp)
            .Take(20);
    }

    private async Task<IEnumerable<RiskAlertDto>> BuildRiskAlertsAsync()
    {
        var alerts = new List<RiskAlertDto>();

        var highRiskResidents = await _db.Residents
            .Include(r => r.Safehouse)
            .Where(r => r.CaseStatus == "Active"
                        && (r.CurrentRiskLevel == "High" || r.CurrentRiskLevel == "Critical"))
            .OrderByDescending(r => r.CurrentRiskLevel == "Critical" ? 1 : 0)
            .ThenBy(r => r.ResidentId)
            .ToListAsync();

        foreach (var r in highRiskResidents)
        {
            var score = r.CurrentRiskLevel == "Critical" ? 0.9 : 0.7;
            var action = r.CurrentRiskLevel == "Critical"
                ? "Immediate case conference required"
                : "Schedule case review within 48 hours";

            alerts.Add(new RiskAlertDto(
                "ResidentRisk", r.ResidentId, r.InternalCode,
                score, r.CurrentRiskLevel!,
                action, r.CaseCategory, r.Safehouse?.Name));
        }

        try
        {
            var churnRisks = await _ml.GetDonorChurnRisksAsync();
            foreach (var donor in churnRisks.Where(d => d.RiskLevel == "High").Take(5))
            {
                alerts.Add(new RiskAlertDto(
                    "DonorChurn", donor.SupporterId, donor.DisplayName,
                    donor.ChurnRiskScore, "High",
                    "Send personalized outreach email"));
            }
        }
        catch
        {
            // ML tables may not exist yet — resident risk alerts still show
        }

        return alerts.OrderByDescending(a => a.RiskScore);
    }
}
