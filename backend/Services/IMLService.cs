using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface IMLService
{
    Task<IEnumerable<DonorChurnRiskDto>> GetDonorChurnRisksAsync();
    Task<ReintegrationReadinessDto?> GetReintegrationReadinessAsync(int residentId);
    Task<SocialMediaRecommendationDto> GetSocialMediaRecommendationsAsync();
    Task<InterventionEffectivenessDto> GetInterventionEffectivenessAsync();
}
