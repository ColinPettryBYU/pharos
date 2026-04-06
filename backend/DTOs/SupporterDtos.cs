namespace Pharos.Api.DTOs;

public record SupporterDto(
    int SupporterId,
    string SupporterType,
    string DisplayName,
    string? OrganizationName,
    string? FirstName,
    string? LastName,
    string? Email,
    string? Phone,
    string Status,
    string? AcquisitionChannel,
    string? Region,
    string Country,
    DateTime CreatedAt,
    DateTime? FirstDonationDate,
    decimal TotalDonated,
    DateTime? LastDonationDate,
    int DonationCount
);

public record SupporterDetailDto(
    int SupporterId,
    string SupporterType,
    string DisplayName,
    string? OrganizationName,
    string? FirstName,
    string? LastName,
    string RelationshipType,
    string? Region,
    string Country,
    string? Email,
    string? Phone,
    string Status,
    DateTime CreatedAt,
    DateTime? FirstDonationDate,
    string? AcquisitionChannel,
    decimal TotalDonated,
    DateTime? LastDonationDate,
    int DonationCount,
    IEnumerable<DonationDto> RecentDonations
);

public record CreateSupporterRequest(
    string SupporterType,
    string DisplayName,
    string? OrganizationName,
    string? FirstName,
    string? LastName,
    string RelationshipType,
    string? Region,
    string Country,
    string? Email,
    string? Phone,
    string? AcquisitionChannel
);

public record UpdateSupporterRequest(
    string? SupporterType,
    string? DisplayName,
    string? OrganizationName,
    string? FirstName,
    string? LastName,
    string? RelationshipType,
    string? Region,
    string? Country,
    string? Email,
    string? Phone,
    string? Status,
    string? AcquisitionChannel
);
