using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services.PlatformClients;

public class YouTubeClient : ISocialPlatformClient
{
    // Rate limit: 10,000 units/day free — video upload costs 1,600 units (~6 uploads/day max)
    private const int CommentCacheMinutes = 5;

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _tokenService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<YouTubeClient> _logger;

    public string PlatformName => "YouTube";

    public YouTubeClient(
        HttpClient http,
        IConfiguration config,
        ITokenEncryptionService tokenService,
        IMemoryCache cache,
        ILogger<YouTubeClient> logger)
    {
        _http = http;
        _config = config;
        _tokenService = tokenService;
        _cache = cache;
        _logger = logger;
    }

    public string BuildOAuthUrl(string redirectUri, string state)
    {
        var clientId = _config["SocialMedia:Google:ClientId"];
        var scopes = "https://www.googleapis.com/auth/youtube.upload " +
                     "https://www.googleapis.com/auth/youtube.force-ssl " +
                     "https://www.googleapis.com/auth/youtube.readonly";

        return $"https://accounts.google.com/o/oauth2/v2/auth" +
               $"?client_id={clientId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&scope={Uri.EscapeDataString(scopes)}" +
               $"&state={state}" +
               $"&response_type=code" +
               $"&access_type=offline" +
               $"&prompt=consent";
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri, string? state = null)
    {
        try
        {
            var clientId = _config["SocialMedia:Google:ClientId"];
            var clientSecret = _config["SocialMedia:Google:ClientSecret"];

            var tokenResponse = await _http.PostAsync(
                "https://oauth2.googleapis.com/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["code"] = code,
                    ["client_id"] = clientId!,
                    ["client_secret"] = clientSecret!,
                    ["redirect_uri"] = redirectUri,
                    ["grant_type"] = "authorization_code"
                }));

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<JsonElement>();
            var accessToken = tokenData.GetProperty("access_token").GetString()!;
            var refreshToken = tokenData.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;
            var expiresIn = tokenData.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 3600;

            var channelRequest = new HttpRequestMessage(HttpMethod.Get,
                "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true");
            channelRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var channelResponse = await _http.SendAsync(channelRequest);
            var channelData = await channelResponse.Content.ReadFromJsonAsync<JsonElement>();

            string? channelId = null;
            string? channelName = null;

            if (channelData.TryGetProperty("items", out var items) && items.GetArrayLength() > 0)
            {
                var first = items[0];
                channelId = first.GetProperty("id").GetString();
                if (first.TryGetProperty("snippet", out var snippet))
                    channelName = snippet.GetProperty("title").GetString();
            }

            return new OAuthTokenResult(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: channelName ?? "YouTube Channel",
                AccountId: channelId,
                PageId: channelId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "YouTube OAuth token exchange failed");
            return new OAuthTokenResult("", null, null, null, null, null, Error: ex.Message);
        }
    }

    public async Task<PostResult> PublishPostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);

            // YouTube only supports video uploads — text posts are community posts (different API)
            // For the compose flow we create a community post if text, or note video is required
            if (request.MediaType == "Text" || string.IsNullOrWhiteSpace(request.MediaType))
            {
                return new PostResult(false, PlatformName, null,
                    Error: "YouTube requires video content. Text-only posts are not supported via API.");
            }

            // Video upload requires multipart — for now, return a placeholder indicating the flow
            return new PostResult(false, PlatformName, null,
                Error: "Video upload requires file attachment. Use the YouTube Studio for direct uploads.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "YouTube publish failed");
            return new PostResult(false, PlatformName, null, Error: ex.Message);
        }
    }

    public Task<PostResult> SchedulePostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        return Task.FromResult(new PostResult(
            false, PlatformName, null,
            Error: "YouTube scheduled publishing requires video upload. Use YouTube Studio."));
    }

    public async Task<List<CommentDto>> GetCommentsAsync(SocialMediaAccount account, int maxResults = 50)
    {
        var cacheKey = $"yt_comments_{account.Id}";
        if (_cache.TryGetValue(cacheKey, out List<CommentDto>? cached) && cached != null)
            return cached;

        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var channelId = account.AccountId;

            var request = new HttpRequestMessage(HttpMethod.Get,
                $"https://www.googleapis.com/youtube/v3/commentThreads" +
                $"?part=snippet&allThreadsRelatedToChannelId={channelId}" +
                $"&maxResults={Math.Min(maxResults, 100)}&order=time");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _http.SendAsync(request);
            var data = await response.Content.ReadFromJsonAsync<JsonElement>();

            var comments = new List<CommentDto>();
            if (data.TryGetProperty("items", out var items))
            {
                foreach (var item in items.EnumerateArray())
                {
                    var snippet = item.GetProperty("snippet").GetProperty("topLevelComment").GetProperty("snippet");
                    comments.Add(new CommentDto(
                        CommentId: item.GetProperty("id").GetString()!,
                        Platform: PlatformName,
                        PostId: snippet.TryGetProperty("videoId", out var vid) ? vid.GetString() : null,
                        CommenterName: snippet.GetProperty("authorDisplayName").GetString()!,
                        CommentText: snippet.GetProperty("textDisplay").GetString()!,
                        CreatedAt: DateTime.Parse(snippet.GetProperty("publishedAt").GetString()!),
                        IsRead: false
                    ));
                }
            }

            _cache.Set(cacheKey, comments, TimeSpan.FromMinutes(CommentCacheMinutes));
            return comments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "YouTube comment fetch failed");
            return [];
        }
    }

    public async Task<bool> ReplyToCommentAsync(SocialMediaAccount account, string commentId, string message)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);

            var body = new
            {
                snippet = new
                {
                    parentId = commentId,
                    textOriginal = message
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post,
                "https://www.googleapis.com/youtube/v3/comments?part=snippet");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content = new StringContent(
                JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "YouTube reply failed for comment {CommentId}", commentId);
            return false;
        }
    }

    public async Task<OAuthTokenResult?> RefreshTokenAsync(SocialMediaAccount account)
    {
        if (string.IsNullOrEmpty(account.EncryptedRefreshToken))
            return null;

        try
        {
            var clientId = _config["SocialMedia:Google:ClientId"];
            var clientSecret = _config["SocialMedia:Google:ClientSecret"];
            var refreshToken = _tokenService.Decrypt(account.EncryptedRefreshToken);

            var response = await _http.PostAsync(
                "https://oauth2.googleapis.com/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["grant_type"] = "refresh_token",
                    ["refresh_token"] = refreshToken,
                    ["client_id"] = clientId!,
                    ["client_secret"] = clientSecret!
                }));

            var data = await response.Content.ReadFromJsonAsync<JsonElement>();
            var newToken = data.GetProperty("access_token").GetString()!;
            var expiresIn = data.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 3600;

            return new OAuthTokenResult(
                AccessToken: newToken,
                RefreshToken: refreshToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: account.AccountName,
                AccountId: account.AccountId,
                PageId: account.PageId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "YouTube token refresh failed");
            return null;
        }
    }
}
