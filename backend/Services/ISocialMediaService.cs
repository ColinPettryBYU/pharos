using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface ISocialMediaService
{
    Task<PagedResult<SocialMediaPostDto>> GetPostsAsync(int page, int pageSize, string? platform, string? postType, string? contentTopic, string? search);
    Task<SocialMediaAnalyticsDto> GetAnalyticsAsync(DateTime? from, DateTime? to, string? platform);
    Task<SocialMediaPostDto> ComposePostAsync(ComposePostRequest request);
}
