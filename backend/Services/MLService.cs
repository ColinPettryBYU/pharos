using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

/// <summary>
/// ML service that queries pre-computed predictions from notebook-exported CSV tables.
/// Falls back to empty data gracefully if the ML tables haven't been seeded yet.
/// </summary>
public class MLService : IMLService
{
    private readonly PharosDbContext _db;

    public MLService(PharosDbContext db) => _db = db;

    public async Task<IEnumerable<DonorChurnRiskDto>> GetDonorChurnRisksAsync()
    {
        var raw = await _db.DonorChurnScores
            .Join(_db.Supporters,
                  s => s.SupporterId,
                  sup => sup.SupporterId,
                  (s, sup) => new
                  {
                      s.SupporterId,
                      sup.DisplayName,
                      sup.SupporterType,
                      s.ChurnRiskScore,
                      s.RiskTier
                  })
            .OrderByDescending(d => d.ChurnRiskScore)
            .ToListAsync();

        return raw.Select(d => new DonorChurnRiskDto(
            d.SupporterId,
            d.DisplayName,
            d.SupporterType,
            d.ChurnRiskScore,
            d.RiskTier,
            0, 0m, 0,
            new List<string>()
        ));
    }

    public async Task<ReintegrationReadinessDto?> GetReintegrationReadinessAsync(int residentId)
    {
        var score = await _db.ResidentReadinessScores
            .FirstOrDefaultAsync(r => r.ResidentId == residentId);
        if (score == null) return null;

        var resident = await _db.Residents.FindAsync(residentId);
        if (resident == null) return null;

        return new ReintegrationReadinessDto(
            resident.ResidentId,
            resident.InternalCode,
            score.ReadinessScore / 100.0,
            score.ReadinessTier,
            new List<ReadinessFactorDto>(),
            new List<string>()
        );
    }

    public async Task<SocialMediaRecommendationDto> GetSocialMediaRecommendationsAsync()
    {
        var rec = await _db.MlSocialMediaRecommendations
            .OrderByDescending(r => r.ComputedAt)
            .FirstOrDefaultAsync();

        var avgEngagement = await _db.SocialMediaPosts
            .Where(p => p.EngagementRate.HasValue)
            .Select(p => p.EngagementRate!.Value)
            .ToListAsync();
        var predictedRate = avgEngagement.Any() ? (double)avgEngagement.Average() : 0;

        if (rec == null)
            return new SocialMediaRecommendationDto("Facebook", "ImpactStory", "DonorImpact",
                10, "Tuesday", null, false, predictedRate, new List<PostInsightDto>());

        return new SocialMediaRecommendationDto(
            rec.Platform, rec.PostType, "DonorImpact",
            rec.RecommendedHour, rec.RecommendedDay, "Photo",
            true,
            predictedRate,
            new List<PostInsightDto>
            {
                new("ResidentStory", rec.IncludeResidentStory
                    ? "Include a resident story — highest-impact content for donations"
                    : "Resident stories are not the top driver for this platform", 0.85),
                new("Timing", $"Post at {rec.RecommendedHour}:00 on {rec.RecommendedDay}s", 0.82),
                new("Platform", $"{rec.Platform} maximizes donation referrals", 0.80),
                new("PredictedDonations",
                    $"Expected donation referrals per post: {rec.PredictedDonations:F1}", 0.75)
            }
        );
    }

    public async Task<InterventionEffectivenessDto> GetInterventionEffectivenessAsync()
    {
        var rows = await _db.InterventionEffectiveness.ToListAsync();

        if (!rows.Any())
            return new InterventionEffectivenessDto(
                new List<InterventionInsightDto>(),
                new List<CategoryEffectivenessDto>());

        var significantInsights = rows.Where(r => r.Significant).Select(r =>
            new InterventionInsightDto(
                r.Intervention,
                r.Coefficient,
                rows.Count(x => x.Intervention == r.Intervention),
                $"{r.Intervention} interventions show a statistically significant effect on {r.Outcome.Replace("delta_", "").Replace("_", " ")} (p={r.PValue:0.000})"
            )).ToList();

        var allCategories = rows.Select(r => r.Intervention).Distinct().ToList();
        var categoriesWithInsights = significantInsights.Select(i => i.InterventionType).Distinct().ToHashSet();
        var fallbackInsights = allCategories
            .Where(c => !categoriesWithInsights.Contains(c))
            .Select(c => new InterventionInsightDto(
                c, 0, rows.Count(x => x.Intervention == c),
                $"No statistically significant effects detected for {c} interventions in current data."
            )).ToList();

        var insights = significantInsights.Concat(fallbackInsights).ToList();

        var byCategory = rows.GroupBy(r => r.Intervention).Select(g =>
        {
            var significantCount = g.Count(r => r.Significant);
            var totalOutcomes = g.Count();
            var score = totalOutcomes > 0 ? (double)significantCount / totalOutcomes * 100 : 0;
            return new CategoryEffectivenessDto(
                g.Key,
                score,
                totalOutcomes,
                g.OrderByDescending(r => Math.Abs(r.Coefficient)).First().Outcome
            );
        }).ToList();

        return new InterventionEffectivenessDto(insights, byCategory);
    }
}
