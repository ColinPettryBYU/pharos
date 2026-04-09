using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services.PlatformClients;

public class FacebookClient : ISocialPlatformClient
{
    private const string GraphApiBase = "https://graph.facebook.com/v21.0";
    // Rate limit: 200 calls/user/hour — cache responses 5 min, batch reads
    private const int CommentCacheMinutes = 5;

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _tokenService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<FacebookClient> _logger;
    private string? _overrideClientId;
    private string? _overrideClientSecret;

    public string PlatformName => "Facebook";

    public FacebookClient(
        HttpClient http,
        IConfiguration config,
        ITokenEncryptionService tokenService,
        IMemoryCache cache,
        ILogger<FacebookClient> logger)
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
        var scopes = "pages_manage_posts,pages_read_engagement,pages_manage_metadata," +
                     "pages_show_list,business_management," +
                     "instagram_basic,instagram_content_publish,instagram_manage_comments," +
                     "instagram_manage_insights";

        return $"https://www.facebook.com/v21.0/dialog/oauth" +
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

            var shortLivedResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/oauth/access_token" +
                $"?client_id={appId}" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                $"&client_secret={appSecret}" +
                $"&code={code}");

            var shortToken = shortLivedResponse.GetProperty("access_token").GetString()!;

            var longLivedResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/oauth/access_token" +
                $"?grant_type=fb_exchange_token" +
                $"&client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&fb_exchange_token={shortToken}");

            var longToken = longLivedResponse.GetProperty("access_token").GetString()!;
            var expiresIn = longLivedResponse.TryGetProperty("expires_in", out var exp)
                ? exp.GetInt64() : 5184000; // 60 days default

            var accountsResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/me/accounts?access_token={longToken}");

            string? pageId = null;
            string? pageToken = null;
            string? pageName = null;

            if (accountsResponse.TryGetProperty("data", out var pages) && pages.GetArrayLength() > 0)
            {
                var firstPage = pages[0];
                pageId = firstPage.GetProperty("id").GetString();
                pageToken = firstPage.GetProperty("access_token").GetString();
                pageName = firstPage.GetProperty("name").GetString();
            }

            return new OAuthTokenResult(
                AccessToken: pageToken ?? longToken,
                RefreshToken: longToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: pageName ?? "Facebook Account",
                AccountId: pageId,
                PageId: pageId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Facebook OAuth token exchange failed");
            return new OAuthTokenResult("", null, null, null, null, null, Error: ex.Message);
        }
    }

    public async Task<PostResult> PublishPostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var pageId = account.PageId ?? account.AccountId;

            var caption = BuildCaption(request);
            var photoUrl = request.PhotoUrl ?? request.MediaUrl ?? request.ImageUrl;
            var linkUrl = request.LinkUrl ?? request.ArticleUrl;

            if (!string.IsNullOrWhiteSpace(photoUrl))
            {
                var photoPayload = new Dictionary<string, string>
                {
                    ["caption"] = caption,
                    ["url"] = photoUrl,
                    ["access_token"] = token
                };
                var response = await _http.PostAsync(
                    $"{GraphApiBase}/{pageId}/photos",
                    new FormUrlEncodedContent(photoPayload));
                var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                if (result.TryGetProperty("id", out var photoId))
                    return new PostResult(true, PlatformName, photoId.GetString(),
                        $"https://www.facebook.com/{photoId.GetString()}");
                var photoErr = result.TryGetProperty("error", out var pe)
                    ? pe.GetProperty("message").GetString() : "Photo upload failed";
                return new PostResult(false, PlatformName, null, Error: photoErr);
            }

            var payload = new Dictionary<string, string>
            {
                ["message"] = caption,
                ["access_token"] = token
            };
            if (!string.IsNullOrWhiteSpace(linkUrl))
                payload["link"] = linkUrl;

            var feedResponse = await _http.PostAsync(
                $"{GraphApiBase}/{pageId}/feed",
                new FormUrlEncodedContent(payload));

            var feedResult = await feedResponse.Content.ReadFromJsonAsync<JsonElement>();
            if (feedResult.TryGetProperty("id", out var idProp))
            {
                var postId = idProp.GetString();
                return new PostResult(true, PlatformName, postId,
                    $"https://www.facebook.com/{postId}");
            }

            var error = feedResult.TryGetProperty("error", out var errProp)
                ? errProp.GetProperty("message").GetString() : "Unknown error";
            return new PostResult(false, PlatformName, null, Error: error);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Facebook publish failed");
            return new PostResult(false, PlatformName, null, Error: ex.Message);
        }
    }

    public async Task<PostResult> SchedulePostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var pageId = account.PageId ?? account.AccountId;
            var unixTime = new DateTimeOffset(request.ScheduledTime!.Value).ToUnixTimeSeconds();

            var payload = new Dictionary<string, string>
            {
                ["message"] = BuildCaption(request),
                ["access_token"] = token,
                ["published"] = "false",
                ["scheduled_publish_time"] = unixTime.ToString()
            };

            var response = await _http.PostAsync(
                $"{GraphApiBase}/{pageId}/feed",
                new FormUrlEncodedContent(payload));

            var result = await response.Content.ReadFromJsonAsync<JsonElement>();

            if (result.TryGetProperty("id", out var idProp))
            {
                return new PostResult(true, PlatformName, idProp.GetString());
            }

            var error = result.TryGetProperty("error", out var errProp)
                ? errProp.GetProperty("message").GetString() : "Unknown error";
            return new PostResult(false, PlatformName, null, Error: error);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Facebook schedule failed");
            return new PostResult(false, PlatformName, null, Error: ex.Message);
        }
    }

    public async Task<List<CommentDto>> GetCommentsAsync(SocialMediaAccount account, int maxResults = 50)
    {
        var cacheKey = $"fb_comments_{account.Id}";
        if (_cache.TryGetValue(cacheKey, out List<CommentDto>? cached) && cached != null)
            return cached;

        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var pageId = account.PageId ?? account.AccountId;

            var postsResponse = await _http.GetFromJsonAsync<JsonElement>(
                $"{GraphApiBase}/{pageId}/feed?fields=id&limit=10&access_token={token}");

            var comments = new List<CommentDto>();

            if (postsResponse.TryGetProperty("data", out var posts))
            {
                foreach (var post in posts.EnumerateArray())
                {
                    var postId = post.GetProperty("id").GetString();
                    var commentsResponse = await _http.GetFromJsonAsync<JsonElement>(
                        $"{GraphApiBase}/{postId}/comments" +
                        $"?fields=id,message,from,created_time&limit=10&access_token={token}");

                    if (commentsResponse.TryGetProperty("data", out var commentData))
                    {
                        foreach (var c in commentData.EnumerateArray())
                        {
                            comments.Add(new CommentDto(
                                CommentId: c.GetProperty("id").GetString()!,
                                Platform: PlatformName,
                                PostId: postId,
                                CommenterName: c.TryGetProperty("from", out var from)
                                    ? from.GetProperty("name").GetString()! : "Unknown",
                                CommentText: c.GetProperty("message").GetString()!,
                                CreatedAt: c.TryGetProperty("created_time", out var ct)
                                    ? DateTime.Parse(ct.GetString()!) : DateTime.UtcNow,
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
            _logger.LogError(ex, "Facebook comment fetch failed");
            return [];
        }
    }

    public async Task<bool> ReplyToCommentAsync(SocialMediaAccount account, string commentId, string message)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);

            var response = await _http.PostAsync(
                $"{GraphApiBase}/{commentId}/comments",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["message"] = message,
                    ["access_token"] = token
                }));

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Facebook reply failed for comment {CommentId}", commentId);
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
            var expiresIn = response.TryGetProperty("expires_in", out var exp)
                ? exp.GetInt64() : 5184000;

            return new OAuthTokenResult(
                AccessToken: newToken,
                RefreshToken: newToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: account.AccountName,
                AccountId: account.AccountId,
                PageId: account.PageId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Facebook token refresh failed");
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
