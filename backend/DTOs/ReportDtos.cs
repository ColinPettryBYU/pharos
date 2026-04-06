namespace Pharos.Api.DTOs;

public record DonationReportDto(
    decimal TotalDonations,
    int TotalDonationCount,
    decimal AvgDonationAmount,
    int RecurringDonorCount,
    IEnumerable<MonthlyDonationTrendDto> MonthlyTrends,
    IEnumerable<CampaignSummaryDto> CampaignSummaries,
    IEnumerable<ChannelSummaryDto> ChannelSummaries
);

public record MonthlyDonationTrendDto(string Month, decimal Total, int Count);

public record CampaignSummaryDto(string CampaignName, decimal Total, int Count);

public record ChannelSummaryDto(string Channel, decimal Total, int Count);

public record OutcomesReportDto(
    int TotalResidents,
    int ActiveResidents,
    int ReintegratedResidents,
    IEnumerable<RiskLevelBreakdownDto> RiskLevelBreakdown,
    IEnumerable<ReintegrationBreakdownDto> ReintegrationBreakdown,
    decimal AvgHealthScore,
    decimal AvgEducationProgress
);

public record RiskLevelBreakdownDto(string RiskLevel, int Count);

public record ReintegrationBreakdownDto(string Status, int Count);

public record SafehouseReportDto(
    int SafehouseId,
    string SafehouseName,
    int ActiveResidents,
    int Capacity,
    decimal OccupancyRate,
    decimal? AvgHealthScore,
    decimal? AvgEducationProgress,
    int RecentIncidents,
    int RecentProcessRecordings,
    int RecentHomeVisitations
);

public record SocialMediaReportDto(
    int TotalPosts,
    decimal AvgEngagementRate,
    int TotalDonationReferrals,
    decimal TotalEstimatedDonationValue,
    string? BestPlatform,
    string? BestPostType,
    string? BestContentTopic,
    int? BestPostHour,
    string? BestDayOfWeek
);

public record PublicImpactSnapshotDto(
    int SnapshotId,
    DateTime SnapshotDate,
    string Headline,
    string? SummaryText,
    string? MetricPayloadJson,
    bool IsPublished,
    DateTime? PublishedAt
);
