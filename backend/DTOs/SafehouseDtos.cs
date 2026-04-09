namespace Pharos.Api.DTOs;

public record SafehouseDto(
    int SafehouseId,
    string SafehouseCode,
    string Name,
    string Region,
    string City,
    string Province,
    string Country,
    DateTime OpenDate,
    string Status,
    int CapacityGirls,
    int CapacityStaff,
    int CurrentOccupancy,
    string? Notes
);

public record SafehouseDetailDto(
    int SafehouseId,
    string SafehouseCode,
    string Name,
    string Region,
    string City,
    string Province,
    string Country,
    DateTime OpenDate,
    string Status,
    int CapacityGirls,
    int CapacityStaff,
    int CurrentOccupancy,
    string? Notes,
    int ActiveResidents,
    int TotalIncidents,
    IEnumerable<SafehouseMonthlyMetricDto> RecentMetrics
);

public record SafehouseSummaryDto(
    int SafehouseId,
    string Name,
    string Region,
    string City,
    int CapacityGirls,
    int CurrentOccupancy,
    string Status
);

public record PublicAggregateSummaryDto(
    int TotalSafehouses,
    int TotalResidents,
    decimal TotalDonations,
    int RegionsCount,
    decimal AvgEducationProgress,
    decimal AvgHealthScore,
    Dictionary<string, int> RegionBreakdown,
    int ReintegratedGirlsCount
);

public record CreateSafehouseRequest(
    string SafehouseCode,
    string Name,
    string Region,
    string City,
    string Province,
    string Country,
    DateTime OpenDate,
    string Status,
    int CapacityGirls,
    int CapacityStaff,
    int CurrentOccupancy,
    string? Notes
);

public record UpdateSafehouseRequest(
    string? Name,
    string? Region,
    string? City,
    string? Province,
    string? Country,
    string? Status,
    int? CapacityGirls,
    int? CapacityStaff,
    int? CurrentOccupancy,
    string? Notes
);

public record SafehouseMonthlyMetricDto(
    int MetricId,
    int SafehouseId,
    DateTime MonthStart,
    DateTime MonthEnd,
    int ActiveResidents,
    decimal? AvgEducationProgress,
    decimal? AvgHealthScore,
    int ProcessRecordingCount,
    int HomeVisitationCount,
    int IncidentCount,
    string? Notes
);
