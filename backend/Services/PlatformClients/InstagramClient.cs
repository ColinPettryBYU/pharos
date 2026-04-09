using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services.PlatformClients;

public class InstagramClient : ISocialPlatformClient
{
    private const string GraphApiBase = "https://graph.facebook.com/v25.0";
    // Rate limit: 200 calls/user/hour — same as Facebook (Meta Graph API)
    private const int CommentCacheMinutes = 5;

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _tokenService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<InstagramClient> _logger;
    private string? _overrideClientId;
    private string? _overrideClientSecret;

    public string PlatformName => "Instagram";

    public InstagramClient(
        HttpClient http,
        IConfiguration config,
        ITokenEncryptionService tokenService,
        IMemoryCache cache,
        ILogger<InstagramClient> logger)
    {
        _http = http;
        _config = config;
        _tokenService = tokenService;
        _cache = cache;
        _logger = logger;
    }

    public void SetCredentialOverrides(string? clientId, string? clientSecret)
    {
        _overrideClientId = clientId;
        _overrideClientSecret = clientSecret;
    }

    private string? ResolveAppId() => _overrideClientId ?? _config["SocialMedia:Meta:AppId"];
    private string? ResolveAppSecret() => _overrideClientSecret ?? _config["SocialMedia:Meta:AppSecret"];

    public string BuildOAuthUrl(string redirectUri, string state)
    {
        var appId = ResolveAppId();
        var scopes = "instagram_basic,instagram_content_publish,instagram_manage_comments," +
                     "instagram_manage_insights,pages_read_engagement";

        return $"https://www.facebook.com/v25.0/dialog/oauth" +
               $"?client_id={appId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&scope={Uri.EscapeDataString(scopes)}" +
               $"&state={state}" +
               $"&response_type=code";
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri, string? state = null)
    {
        try
        {
            var appId = ResolveAppId();
            var appSecret = ResolveAppSecret();

            var tokenResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/oauth/access_token" +
                $"?client_id={appId}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                $"&client_secret={appSecret}" +
                $"&code={code}");

            var shortToken = tokenResponse.GetProperty("access_token").GetString()!;

            var longLivedResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/oauth/access_token" +
                $"?grant_type=fb_exchange_token" +
                $"&client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&fb_exchange_token={shortToken}");

            var longToken = longLivedResponse.GetProperty("access_token").GetString()!;

            var pagesResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/me/accounts?access_token={longToken}");

            string? igAccountId = null;
            string? accountName = null;
            string? pageId = null;
            string? pageToken = null;

            if (pagesResponse.TryGetProperty("data", out var pages))
            {
                foreach (var page in pages.EnumerateArray())
                {
                    pageId = page.GetProperty("id").GetString();
                    pageToken = page.GetProperty("access_token").GetString();

                    var igResponse = await _http.GetFromJsonAsync<JsonElement>(
                        $"{GraphApiBase}/{pageId}?fields=instagram_business_account&access_token={pageToken}");

                    if (igResponse.TryGetProperty("instagram_business_account", out var igBiz))
                    {
                        igAccountId = igBiz.GetProperty("id").GetString();
                        var igInfo = await _http.GetFromJsonAsync<JsonElement>(
                            $"{GraphApiBase}/{igAccountId}?fields=username&access_token={pageToken}");
                        accountName = igInfo.TryGetProperty("username", out var un) ? un.GetString() : null;
                        break;
                    }
                }
            }

            return new OAuthTokenResult(
                AccessToken: pageToken ?? longToken,
                RefreshToken: longToken,
                ExpiresAt: DateTime.UtcNow.AddDays(60),
                AccountName: accountName != null ? $"@{accountName}" : "Instagram Account",
                AccountId: igAccountId,
                PageId: pageId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instagram OAuth token exchange failed");
            return new OAuthTokenResult("", null, null, null, null, null, Error: ex.Message);
        }
    }

    public async Task<PostResult> PublishPostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var igUserId = account.AccountId;

            if (string.IsNullOrEmpty(igUserId))
                return new PostResult(false, PlatformName, null, Error: "No Instagram business account linked");

            var caption = BuildCaption(request);
            var mediaUrl = request.MediaUrl ?? request.PhotoUrl ?? request.ImageUrl;
            var videoUrl = request.VideoUrl;

            if (string.IsNullOrWhiteSpace(mediaUrl) && string.IsNullOrWhiteSpace(videoUrl))
                return new PostResult(false, PlatformName, null, Error: "Instagram requires an image or video URL. Please attach media before publishing.");

            var containerParams = new Dictionary<string, string>
            {
                ["caption"] = caption,
                ["access_token"] = token
            };

            var isVideo = !string.IsNullOrWhiteSpace(videoUrl)
                || (request.MediaType?.ToUpperInvariant() is "VIDEO" or "REEL" or "REELS");

            if (isVideo)
            {
                containerParams["media_type"] = "REELS";
                containerParams["video_url"] = videoUrl ?? mediaUrl!;
            }
            else
            {
                containerParams["image_url"] = mediaUrl!;
            }

            var containerResponse = await _http.PostAsync(
                $"{GraphApiBase}/{igUserId}/media",
                new FormUrlEncodedContent(containerParams));

            var containerResult = await containerResponse.Content.ReadFromJsonAsync<JsonElement>();

            if (!containerResult.TryGetProperty("id", out var containerId))
            {
                var error = containerResult.TryGetProperty("error", out var err)
                    ? err.GetProperty("message").GetString() : "Failed to create media container";
                return new PostResult(false, PlatformName, null, Error: error);
            }

            // Step 2: Publish the container
            var publishResponse = await _http.PostAsync(
                $"{GraphApiBase}/{igUserId}/media_publish",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["creation_id"] = containerId.GetString()!,
                    ["access_token"] = token
                }));

            var publishResult = await publishResponse.Content.ReadFromJsonAsync<JsonElement>();

            if (publishResult.TryGetProperty("id", out var mediaId))
            {
                return new PostResult(true, PlatformName, mediaId.GetString(),
                    $"https://www.instagram.com/p/{mediaId.GetString()}");
            }

            var publishError = publishResult.TryGetProperty("error", out var pubErr)
                ? pubErr.GetProperty("message").GetString() : "Unknown publish error";
            return new PostResult(false, PlatformName, null, Error: publishError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instagram publish failed");
            return new PostResult(false, PlatformName, null, Error: ex.Message);
        }
    }

    public Task<PostResult> SchedulePostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        // Instagram Graph API doesn't natively support scheduled publishing
        // Store as draft, return success with note
        return Task.FromResult(new PostResult(
            true, PlatformName, null,
            Error: "Instagram doesn't support native scheduling. Post saved as draft."));
    }

    public async Task<List<CommentDto>> GetCommentsAsync(SocialMediaAccount account, int maxResults = 50)
    {
        var cacheKey = $"ig_comments_{account.Id}";
        if (_cache.TryGetValue(cacheKey, out List<CommentDto>? cached) && cached != null)
            return cached;

        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var igUserId = account.AccountId;

            var mediaResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/{igUserId}/media?fields=id,caption,timestamp&limit=10&access_token={token}");

            var comments = new List<CommentDto>();

            if (mediaResponse.TryGetProperty("data", out var mediaItems))
            {
                foreach (var media in mediaItems.EnumerateArray())
                {
                    var mediaId = media.GetProperty("id").GetString();
                    var commentsResponse = await _http.GetFromJsonAsync<JsonElement>(
                        $"{GraphApiBase}/{mediaId}/comments" +
                        $"?fields=id,text,username,timestamp&limit=10&access_token={token}");

                    if (commentsResponse.TryGetProperty("data", out var commentData))
                    {
                        foreach (var c in commentData.EnumerateArray())
                        {
                            comments.Add(new CommentDto(
                                CommentId: c.GetProperty("id").GetString()!,
                                Platform: PlatformName,
                                PostId: mediaId,
                                CommenterName: c.TryGetProperty("username", out var un) ? un.GetString()! : "Unknown",
                                CommentText: c.GetProperty("text").GetString()!,
                                CreatedAt: c.TryGetProperty("timestamp", out var ts)
                                    ? DateTime.Parse(ts.GetString()!) : DateTime.UtcNow,
                                IsRead: false
                            ));
                        }
                    }

                    if (comments.Count >= maxResults) break;
                }
            }

            _cache.Set(cacheKey, comments, TimeSpan.FromMinutes(CommentCacheMinutes));
            return comments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instagram comment fetch failed");
            return [];
        }
    }

    public async Task<bool> ReplyToCommentAsync(SocialMediaAccount account, string commentId, string message)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);

            var response = await _http.PostAsync(
                $"{GraphApiBase}/{commentId}/replies",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["message"] = message,
                    ["access_token"] = token
                }));

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instagram reply failed for comment {CommentId}", commentId);
            return false;
        }
    }

    public async Task<OAuthTokenResult?> RefreshTokenAsync(SocialMediaAccount account)
    {
        try
        {
            var appId = ResolveAppId();
            var appSecret = ResolveAppSecret();
            var currentToken = _tokenService.Decrypt(account.EncryptedRefreshToken ?? account.EncryptedAccessToken);

            var response = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/oauth/access_token" +
                $"?grant_type=fb_exchange_token" +
                $"&client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&fb_exchange_token={currentToken}");

            var newToken = response.GetProperty("access_token").GetString()!;

            return new OAuthTokenResult(
                AccessToken: newToken,
                RefreshToken: newToken,
                ExpiresAt: DateTime.UtcNow.AddDays(60),
                AccountName: account.AccountName,
                AccountId: account.AccountId,
                PageId: account.PageId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Instagram token refresh failed");
            return null;
        }
    }

    private static string BuildCaption(ComposePostRequest request)
    {
        var caption = request.Caption;
        if (!string.IsNullOrWhiteSpace(request.Hashtags))
            caption += "\n\n" + request.Hashtags;
        return caption;
    }
}
