using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface IPartnerService
{
    Task<PagedResult<PartnerDto>> GetAllAsync(int page, int pageSize, string? partnerType, string? status, string? search);
    Task<PartnerDto> CreateAsync(CreatePartnerRequest request);
    Task<PartnerDto?> UpdateAsync(int id, UpdatePartnerRequest request);
    Task<bool> DeleteAsync(int id);
}
