namespace Pharos.Api.DTOs;

public record DashboardDto(
    DashboardStatsDto Stats,
    IEnumerable<MonthlyDonationTrendDto> DonationTrends,
    IEnumerable<SafehouseOccupancyDto> SafehouseOccupancy,
    IEnumerable<ActivityFeedItemDto> RecentActivity,
    IEnumerable<RiskAlertDto> RiskAlerts
);

public record DashboardStatsDto(
    int ActiveResidents,
    decimal MonthlyDonationTotal,
    decimal MonthlyDonationChange,
    int CasesNeedingReview,
    decimal AvgSocialEngagement,
    decimal SocialEngagementChange
);

public record SafehouseOccupancyDto(
    int SafehouseId,
    string Name,
    int CurrentOccupancy,
    int CapacityGirls,
    decimal OccupancyRate
);

public record ActivityFeedItemDto(
    string Type,
    string Description,
    DateTime Timestamp,
    int? RelatedId
);

public record RiskAlertDto(
    string AlertType,
    int RelatedId,
    string Name,
    double RiskScore,
    string RecommendedAction
);
