namespace Pharos.Api.DTOs;

public record DonorProfileDto(
    int SupporterId,
    string DisplayName,
    string? OrganizationName,
    string SupporterType,
    string? Email,
    DateTime? FirstDonationDate,
    string? AcquisitionChannel,
    decimal TotalDonated,
    int DonationCount
);

public record DonorImpactDto(
    decimal TotalDonated,
    int TotalDonations,
    int SafehousesImpacted,
    IEnumerable<string> ProgramAreasSupported,
    IEnumerable<DonationTimelineDto> DonationTimeline,
    IEnumerable<ImpactAllocationDto> Allocations
);

public record DonationTimelineDto(
    int DonationId,
    DateTime DonationDate,
    string DonationType,
    decimal? Amount,
    string? CampaignName
);

public record ImpactAllocationDto(
    string SafehouseName,
    string ProgramArea,
    decimal TotalAllocated
);

public record UserManagementDto(
    string Id,
    string? Email,
    string? DisplayName,
    IEnumerable<string> Roles,
    int? LinkedSupporterId,
    bool MfaEnabled,
    bool IsLockedOut
);

public record UpdateUserRolesRequest(
    IEnumerable<string> Roles
);

public record InviteUserRequest(
    string Email,
    string DisplayName,
    string Password,
    string Role,
    int? LinkedSupporterId
);

public record DonorDonateRequest(
    decimal Amount,
    bool IsRecurring,
    string? Notes
);
