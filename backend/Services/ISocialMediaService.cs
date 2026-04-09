using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface ISocialMediaService
{
    Task<PagedResult<SocialMediaPostDto>> GetPostsAsync(int page, int pageSize, string? platform, string? postType, string? contentTopic, string? search);
    Task<SocialMediaAnalyticsDto> GetAnalyticsAsync(DateTime? from, DateTime? to, string? platform);
    Task<ComposeResultDto> ComposePostAsync(ComposePostRequest request);
    Task<CommentInboxResponse> GetCommentInboxAsync(string? platform, int page, int pageSize);
    Task<bool> ReplyToCommentAsync(string platform, string commentId, string message);
}
