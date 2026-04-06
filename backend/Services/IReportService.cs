using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface IReportService
{
    Task<DonationReportDto> GetDonationReportAsync(DateTime? from, DateTime? to);
    Task<OutcomesReportDto> GetOutcomesReportAsync();
    Task<IEnumerable<SafehouseReportDto>> GetSafehouseReportAsync();
    Task<SocialMediaReportDto> GetSocialMediaReportAsync(DateTime? from, DateTime? to);
    Task<PagedResult<PublicImpactSnapshotDto>> GetImpactSnapshotsAsync(int page, int pageSize);
    Task<PublicImpactSnapshotDto?> GetImpactSnapshotByIdAsync(int id);
}
