namespace Pharos.Api.DTOs;

public record DonorChurnRiskDto(
    int SupporterId,
    string DisplayName,
    string SupporterType,
    double ChurnRiskScore,
    string RiskLevel,
    int DaysSinceLastDonation,
    decimal TotalDonated,
    int DonationCount,
    IEnumerable<string> RiskFactors
);

public record ReintegrationReadinessDto(
    int ResidentId,
    string InternalCode,
    double ReadinessScore,
    string ReadinessLevel,
    IEnumerable<ReadinessFactorDto> ContributingFactors,
    IEnumerable<string> Recommendations
);

public record ReadinessFactorDto(
    string FactorName,
    double Score,
    double Weight,
    string Trend
);

public record SocialMediaRecommendationDto(
    string RecommendedPlatform,
    string RecommendedPostType,
    string RecommendedContentTopic,
    int RecommendedPostHour,
    string RecommendedDayOfWeek,
    string? RecommendedMediaType,
    bool ShouldBoost,
    double PredictedEngagementRate,
    IEnumerable<PostInsightDto> Insights
);

public record PostInsightDto(
    string InsightType,
    string Description,
    double ConfidenceScore
);

public record InterventionEffectivenessDto(
    IEnumerable<InterventionInsightDto> Insights,
    IEnumerable<CategoryEffectivenessDto> ByCategory,
    IEnumerable<KeyDriverDto> KeyDrivers
);

public record InterventionInsightDto(
    string InterventionType,
    double EffectivenessScore,
    int SampleSize,
    string Description
);

public record CategoryEffectivenessDto(
    string Category,
    double AvgOutcomeImprovement,
    int PlanCount,
    string MostEffectiveService
);

public record KeyDriverDto(
    string DriverName,
    double EffectivenessScore,
    int OutcomesAffected,
    string Description
);

public record ResidentRiskPredictionDto(
    int ResidentId,
    string? InternalCode,
    double RiskScore,
    bool RiskFlag,
    string RiskLevel,
    List<RiskFactorDto> TopFactors,
    DateTime LastUpdated
);

public record RiskFactorDto(
    string Feature,
    string Direction
);
