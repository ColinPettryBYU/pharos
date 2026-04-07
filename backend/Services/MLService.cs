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
        var scores = await _db.DonorChurnScores
            .Join(_db.Supporters,
                  s => s.SupporterId,
                  sup => sup.SupporterId,
                  (s, sup) => new DonorChurnRiskDto(
                      s.SupporterId,
                      sup.DisplayName,
                      sup.SupporterType,
                      s.ChurnRiskScore,
                      s.RiskTier,
                      0, 0m, 0,
                      new List<string>()
                  ))
            .OrderByDescending(d => d.ChurnRiskScore)
            .ToListAsync();
        return scores;
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

        if (rec == null)
            return new SocialMediaRecommendationDto("Facebook", "ImpactStory", "DonorImpact",
                10, "Tuesday", null, false, new List<PostInsightDto>());

        return new SocialMediaRecommendationDto(
            rec.Platform, rec.PostType, "DonorImpact",
            rec.RecommendedHour, rec.RecommendedDay, "Photo",
            true,
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

        var insights = rows.Where(r => r.Significant).Select(r =>
            new InterventionInsightDto(
                r.Intervention,
                r.Coefficient,
                rows.Count(x => x.Intervention == r.Intervention),
                $"{r.Intervention} interventions show a statistically significant coefficient of {r.Coefficient:+0.000;-0.000} on {r.Outcome.Replace("delta_", "").Replace("_", " ")} (p={r.PValue:0.000})"
            )).ToList();

        var byCategory = rows.GroupBy(r => r.Intervention).Select(g =>
            new CategoryEffectivenessDto(
                g.Key,
                g.Average(r => r.Coefficient) * 100,
                g.Count(),
                g.OrderByDescending(r => Math.Abs(r.Coefficient)).First().Outcome
            )).ToList();

        return new InterventionEffectivenessDto(insights, byCategory);
    }
}
