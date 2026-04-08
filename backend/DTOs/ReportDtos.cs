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

public record MonthlyDonationTrendDto(
    string Month,
    decimal Total,
    int Count,
    decimal Monetary,
    decimal InKind,
    decimal Recurring,
    decimal OneTime
);

public record CampaignSummaryDto(string CampaignName, decimal Total, int Count);

public record ChannelSummaryDto(string Channel, decimal Total, int Count);

public record OutcomesReportDto(
    int TotalResidents,
    int ActiveResidents,
    int ReintegratedResidents,
    IEnumerable<RiskLevelBreakdownDto> RiskLevelBreakdown,
    IEnumerable<ReintegrationBreakdownDto> ReintegrationBreakdown,
    decimal AvgHealthScore,
    decimal AvgEducationProgress,
    IEnumerable<MonthlyProgressDto> EducationProgress,
    IEnumerable<MonthlyProgressDto> HealthTrends,
    IEnumerable<NameCountDto> EmotionalDistribution,
    IEnumerable<InterventionCompletionDto> InterventionCompletion
);

public record MonthlyProgressDto(string Month, decimal AvgValue);

public record NameCountDto(string Name, int Count);

public record InterventionCompletionDto(string Category, int Completed, int Total);

public record RiskLevelBreakdownDto(string RiskLevel, int Count);

public record ReintegrationBreakdownDto(string Status, int Count);

public record SafehouseReportResponseDto(
    IEnumerable<SafehouseReportDto> Data,
    IEnumerable<SafehouseMonthlyMetricSummaryDto> MonthlyMetrics
);

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

public record SafehouseMonthlyMetricSummaryDto(
    int SafehouseId,
    string SafehouseName,
    DateTime MonthStart,
    int ActiveResidents,
    decimal? AvgEducationProgress,
    decimal? AvgHealthScore,
    int ProcessRecordingCount,
    int HomeVisitationCount,
    int IncidentCount
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
    string? BestDayOfWeek,
    IEnumerable<ReportPlatformBreakdownDto> PlatformBreakdown,
    IEnumerable<PostTypePerformanceDto> PostTypePerformance,
    IEnumerable<EngagementTrendDto> EngagementTrends,
    IEnumerable<DonationAttributionDto> DonationAttribution,
    IEnumerable<ContentTopicPerformanceDto> ContentTopicPerformance
);

public record ContentTopicPerformanceDto(string Topic, decimal AvgEngagement, int DonationReferrals);

public record ReportPlatformBreakdownDto(string Platform, int PostCount, decimal AvgEngagement, int DonationReferrals, long TotalReach);

public record PostTypePerformanceDto(string PostType, int PostCount, decimal AvgEngagement, int DonationReferrals);

public record EngagementTrendDto(string Month, decimal AvgEngagement, int PostCount);

public record DonationAttributionDto(string Platform, int Referrals, decimal EstimatedValue);

public record PublicImpactSnapshotDto(
    int SnapshotId,
    DateTime SnapshotDate,
    string Headline,
    string? SummaryText,
    string? MetricPayloadJson,
    bool IsPublished,
    DateTime? PublishedAt
);
