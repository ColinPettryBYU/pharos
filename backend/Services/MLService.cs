using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

/// <summary>
/// Stub ML service that computes heuristic-based predictions.
/// These endpoints will be replaced with real ML model inference once the
/// Python pipelines are trained and exported (ONNX or ML.NET).
/// </summary>
public class MLService : IMLService
{
    private readonly PharosDbContext _db;

    public MLService(PharosDbContext db) => _db = db;

    public async Task<IEnumerable<DonorChurnRiskDto>> GetDonorChurnRisksAsync()
    {
        var supporters = await _db.Supporters
            .Include(s => s.Donations)
            .Where(s => s.Donations.Any())
            .ToListAsync();

        var today = DateTime.UtcNow;

        return supporters.Select(s =>
        {
            var donations = s.Donations.OrderByDescending(d => d.DonationDate).ToList();
            var lastDonation = donations.First().DonationDate;
            var daysSinceLast = (today - lastDonation).Days;
            var totalDonated = donations.Where(d => d.Amount.HasValue).Sum(d => d.Amount!.Value);
            var donationCount = donations.Count;

            // Heuristic churn risk: higher if longer since last donation, lower donation count
            var recencyRisk = Math.Min(daysSinceLast / 365.0, 1.0);
            var frequencyRisk = Math.Max(1.0 - (donationCount / 20.0), 0.0);
            var amountRisk = totalDonated < 1000 ? 0.3 : totalDonated < 5000 ? 0.15 : 0.05;
            var churnScore = Math.Round((recencyRisk * 0.5 + frequencyRisk * 0.3 + amountRisk * 0.2), 3);

            var riskFactors = new List<string>();
            if (daysSinceLast > 180) riskFactors.Add("No donation in 6+ months");
            if (donationCount <= 2) riskFactors.Add("Low donation frequency");
            if (!donations.Any(d => d.IsRecurring)) riskFactors.Add("No recurring donations");
            if (totalDonated < 1000) riskFactors.Add("Low total contribution");

            var riskLevel = churnScore switch
            {
                >= 0.7 => "High",
                >= 0.4 => "Medium",
                _ => "Low"
            };

            return new DonorChurnRiskDto(
                s.SupporterId, s.DisplayName, s.SupporterType, churnScore, riskLevel,
                daysSinceLast, totalDonated, donationCount, riskFactors);
        }).OrderByDescending(d => d.ChurnRiskScore);
    }

    public async Task<ReintegrationReadinessDto?> GetReintegrationReadinessAsync(int residentId)
    {
        var resident = await _db.Residents
            .Include(r => r.HealthRecords)
            .Include(r => r.EducationRecords)
            .Include(r => r.ProcessRecordings)
            .Include(r => r.HomeVisitations)
            .Include(r => r.InterventionPlans)
            .FirstOrDefaultAsync(r => r.ResidentId == residentId);

        if (resident == null) return null;

        var latestHealth = resident.HealthRecords.OrderByDescending(h => h.RecordDate).FirstOrDefault();
        var latestEducation = resident.EducationRecords.OrderByDescending(e => e.RecordDate).FirstOrDefault();
        var recentSessions = resident.ProcessRecordings.OrderByDescending(p => p.SessionDate).Take(5).ToList();
        var recentVisits = resident.HomeVisitations.OrderByDescending(v => v.VisitDate).Take(3).ToList();
        var completedPlans = resident.InterventionPlans.Count(p => p.Status == "Achieved");
        var totalPlans = resident.InterventionPlans.Count;

        // Heuristic readiness factors
        var healthScore = latestHealth != null ? (double)latestHealth.GeneralHealthScore / 5.0 : 0.5;
        var educationScore = latestEducation?.ProgressPercent != null ? (double)latestEducation.ProgressPercent.Value / 100.0 : 0.3;
        var emotionalScore = recentSessions.Count > 0 ?
            recentSessions.Count(s => s.EmotionalStateEnd is "Calm" or "Hopeful" or "Happy") / (double)recentSessions.Count : 0.5;
        var familyScore = recentVisits.Count > 0 ?
            recentVisits.Count(v => v.VisitOutcome is "Favorable") / (double)recentVisits.Count : 0.5;
        var planScore = totalPlans > 0 ? completedPlans / (double)totalPlans : 0.3;

        var readinessScore = Math.Round(healthScore * 0.2 + educationScore * 0.25 + emotionalScore * 0.25 + familyScore * 0.15 + planScore * 0.15, 3);
        var readinessLevel = readinessScore switch
        {
            >= 0.75 => "Ready",
            >= 0.5 => "Nearly Ready",
            >= 0.3 => "In Progress",
            _ => "Not Ready"
        };

        var factors = new List<ReadinessFactorDto>
        {
            new("Health", healthScore, 0.2, latestHealth != null && (double)latestHealth.GeneralHealthScore >= 3.5 ? "Improving" : "Stable"),
            new("Education", educationScore, 0.25, latestEducation?.CompletionStatus == "Completed" ? "Completed" : "In Progress"),
            new("Emotional Wellbeing", emotionalScore, 0.25, emotionalScore >= 0.6 ? "Positive" : "Needs Support"),
            new("Family Cooperation", familyScore, 0.15, familyScore >= 0.6 ? "Cooperative" : "Needs Work"),
            new("Intervention Completion", planScore, 0.15, planScore >= 0.7 ? "On Track" : "Behind")
        };

        var recommendations = new List<string>();
        if (healthScore < 0.6) recommendations.Add("Schedule comprehensive health assessment");
        if (educationScore < 0.5) recommendations.Add("Provide additional education support");
        if (emotionalScore < 0.5) recommendations.Add("Increase counseling session frequency");
        if (familyScore < 0.5) recommendations.Add("Conduct family reconciliation sessions");
        if (planScore < 0.5) recommendations.Add("Review and update intervention plan goals");
        if (!recommendations.Any()) recommendations.Add("Resident is progressing well - continue current plan");

        return new ReintegrationReadinessDto(
            resident.ResidentId, resident.InternalCode, readinessScore, readinessLevel,
            factors, recommendations);
    }

    public async Task<SocialMediaRecommendationDto> GetSocialMediaRecommendationsAsync()
    {
        var posts = await _db.SocialMediaPosts.ToListAsync();

        // Find best-performing combinations
        var bestPlatform = posts.GroupBy(p => p.Platform)
            .OrderByDescending(g => g.Sum(p => p.DonationReferrals ?? 0))
            .FirstOrDefault()?.Key ?? "Facebook";

        var bestPostType = posts.GroupBy(p => p.PostType)
            .OrderByDescending(g => g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())
            .FirstOrDefault()?.Key ?? "ImpactStory";

        var bestTopic = posts.Where(p => p.ContentTopic != null).GroupBy(p => p.ContentTopic!)
            .OrderByDescending(g => g.Sum(p => p.DonationReferrals ?? 0))
            .FirstOrDefault()?.Key ?? "DonorImpact";

        var bestHour = posts.Where(p => p.PostHour.HasValue).GroupBy(p => p.PostHour!.Value)
            .OrderByDescending(g => g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())
            .FirstOrDefault()?.Key ?? 10;

        var bestDay = posts.Where(p => p.DayOfWeek != null).GroupBy(p => p.DayOfWeek!)
            .OrderByDescending(g => g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())
            .FirstOrDefault()?.Key ?? "Tuesday";

        var bestMedia = posts.Where(p => p.MediaType != null).GroupBy(p => p.MediaType!)
            .OrderByDescending(g => g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())
            .FirstOrDefault()?.Key;

        var boostedAvg = (double)posts.Where(p => p.IsBoosted && p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average();
        var organicAvg = (double)posts.Where(p => !p.IsBoosted && p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average();

        var insights = new List<PostInsightDto>
        {
            new("Platform", $"{bestPlatform} drives the most donation referrals", 0.85),
            new("Timing", $"Posts at {bestHour}:00 on {bestDay}s get the highest engagement", 0.78),
            new("Content", $"{bestTopic} content generates the most donation conversions", 0.82),
            new("Boosting", boostedAvg > organicAvg ? "Boosted posts outperform organic by " + Math.Round((boostedAvg - organicAvg) / organicAvg * 100.0, 1) + "%" : "Organic posts perform comparably to boosted", 0.72)
        };

        return new SocialMediaRecommendationDto(
            bestPlatform, bestPostType, bestTopic, bestHour, bestDay,
            bestMedia, boostedAvg > organicAvg * 1.2, insights);
    }

    public async Task<InterventionEffectivenessDto> GetInterventionEffectivenessAsync()
    {
        var plans = await _db.InterventionPlans.Include(p => p.Resident).ToListAsync();

        var byCategory = plans
            .GroupBy(p => p.PlanCategory)
            .Select(g =>
            {
                var achieved = g.Count(p => p.Status == "Achieved");
                var total = g.Count();
                var avgImprovement = total > 0 ? Math.Round((double)achieved / total * 100, 1) : 0;
                var mostCommonService = g
                    .Where(p => p.ServicesProvided != null)
                    .SelectMany(p => p.ServicesProvided!.Split(',', StringSplitOptions.TrimEntries))
                    .GroupBy(s => s)
                    .OrderByDescending(s => s.Count())
                    .FirstOrDefault()?.Key ?? "N/A";

                return new CategoryEffectivenessDto(g.Key, avgImprovement, total, mostCommonService);
            }).ToList();

        var insights = new List<InterventionInsightDto>();
        foreach (var cat in byCategory.OrderByDescending(c => c.AvgOutcomeImprovement))
        {
            insights.Add(new InterventionInsightDto(
                cat.Category,
                cat.AvgOutcomeImprovement / 100.0,
                cat.PlanCount,
                $"{cat.Category} interventions have a {cat.AvgOutcomeImprovement}% completion rate. Most effective service: {cat.MostEffectiveService}"));
        }

        return new InterventionEffectivenessDto(insights, byCategory);
    }
}
