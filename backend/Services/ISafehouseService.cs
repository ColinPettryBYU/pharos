using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface ISafehouseService
{
    Task<PagedResult<SafehouseDto>> GetAllAsync(int page, int pageSize, string? status, string? search);
    Task<SafehouseDetailDto?> GetByIdAsync(int id);
    Task<SafehouseDto> CreateAsync(CreateSafehouseRequest request);
    Task<SafehouseDto?> UpdateAsync(int id, UpdateSafehouseRequest request);
    Task<bool> DeleteAsync(int id);
    Task<IEnumerable<SafehouseSummaryDto>> GetPublicSummaryAsync();
}
