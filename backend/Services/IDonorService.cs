using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface IDonorService
{
    // Supporters
    Task<PagedResult<SupporterDto>> GetSupportersAsync(int page, int pageSize, string? supporterType, string? status, string? search);
    Task<SupporterDetailDto?> GetSupporterByIdAsync(int id);
    Task<SupporterDto> CreateSupporterAsync(CreateSupporterRequest request);
    Task<SupporterDto?> UpdateSupporterAsync(int id, UpdateSupporterRequest request);
    Task<bool> DeleteSupporterAsync(int id);

    // Donations
    Task<PagedResult<DonationDto>> GetDonationsAsync(int page, int pageSize, string? donationType, string? campaignName, string? search);
    Task<DonationDetailDto?> GetDonationByIdAsync(int id);
    Task<DonationDto> CreateDonationAsync(CreateDonationRequest request);
    Task<DonationDto?> UpdateDonationAsync(int id, UpdateDonationRequest request);
    Task<bool> DeleteDonationAsync(int id);

    // Allocations
    Task<PagedResult<DonationAllocationDto>> GetAllocationsAsync(int page, int pageSize, int? safehouseId);
    Task<DonationAllocationDto> CreateAllocationAsync(CreateDonationAllocationRequest request);

    // Donor portal
    Task<DonorProfileDto?> GetDonorProfileAsync(int supporterId);
    Task<PagedResult<DonationDto>> GetDonorDonationsAsync(int supporterId, int page, int pageSize);
    Task<DonorImpactDto?> GetDonorImpactAsync(int supporterId);
}
