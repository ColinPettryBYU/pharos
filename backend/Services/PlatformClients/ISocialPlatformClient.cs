using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services.PlatformClients;

public interface ISocialPlatformClient
{
    string PlatformName { get; }

    string BuildOAuthUrl(string redirectUri, string state);

    Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri);

    Task<PostResult> PublishPostAsync(SocialMediaAccount account, ComposePostRequest request);

    Task<PostResult> SchedulePostAsync(SocialMediaAccount account, ComposePostRequest request);

    Task<List<CommentDto>> GetCommentsAsync(SocialMediaAccount account, int maxResults = 50);

    Task<bool> ReplyToCommentAsync(SocialMediaAccount account, string commentId, string message);

    Task<OAuthTokenResult?> RefreshTokenAsync(SocialMediaAccount account);
}

public record PostResult(bool Success, string Platform, string? PlatformPostId, string? PostUrl = null, string? Error = null);

public record OAuthTokenResult(
    string AccessToken,
    string? RefreshToken,
    DateTime? ExpiresAt,
    string? AccountName,
    string? AccountId,
    string? PageId,
    string? Error = null
);

public record CommentDto(
    string CommentId,
    string Platform,
    string? PostId,
    string CommenterName,
    string CommentText,
    DateTime CreatedAt,
    bool IsRead,
    string? PostThumbnail = null
);
