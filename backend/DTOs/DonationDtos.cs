namespace Pharos.Api.DTOs;

public record DonationDto(
    int DonationId,
    int SupporterId,
    string? SupporterName,
    string DonationType,
    DateTime DonationDate,
    bool IsRecurring,
    string? CampaignName,
    string ChannelSource,
    string? CurrencyCode,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    string? Notes,
    int? ReferralPostId
);

public record DonationDetailDto(
    int DonationId,
    int SupporterId,
    string? SupporterName,
    string DonationType,
    DateTime DonationDate,
    bool IsRecurring,
    string? CampaignName,
    string ChannelSource,
    string? CurrencyCode,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    string? Notes,
    int? ReferralPostId,
    IEnumerable<InKindDonationItemDto> InKindItems,
    IEnumerable<DonationAllocationDto> Allocations
);

public record CreateDonationRequest(
    int SupporterId,
    string DonationType,
    DateTime DonationDate,
    bool IsRecurring,
    string? CampaignName,
    string ChannelSource,
    string? CurrencyCode,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    string? Notes,
    int? ReferralPostId
);

public record UpdateDonationRequest(
    string? DonationType,
    DateTime? DonationDate,
    bool? IsRecurring,
    string? CampaignName,
    string? ChannelSource,
    string? CurrencyCode,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    string? Notes,
    int? ReferralPostId
);

public record InKindDonationItemDto(
    int ItemId,
    int DonationId,
    string ItemName,
    string ItemCategory,
    int Quantity,
    string? UnitOfMeasure,
    decimal? EstimatedUnitValue,
    string? IntendedUse,
    string? ReceivedCondition
);

public record DonationAllocationDto(
    int AllocationId,
    int DonationId,
    int SafehouseId,
    string? SafehouseName,
    string ProgramArea,
    decimal AmountAllocated,
    DateTime AllocationDate,
    string? AllocationNotes
);

public record CreateDonationAllocationRequest(
    int DonationId,
    int SafehouseId,
    string ProgramArea,
    decimal AmountAllocated,
    DateTime AllocationDate,
    string? AllocationNotes
);
