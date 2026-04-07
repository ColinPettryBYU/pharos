using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync();
}
