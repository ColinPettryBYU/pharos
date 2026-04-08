using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services.PlatformClients;

public class TikTokClient : ISocialPlatformClient
{
    // Rate limits vary by approval level — use draft option when possible
    private const string ApiBase = "https://open.tiktokapis.com";

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _tokenService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<TikTokClient> _logger;

    public string PlatformName => "TikTok";

    public TikTokClient(
        HttpClient http,
        IConfiguration config,
        ITokenEncryptionService tokenService,
        IMemoryCache cache,
        ILogger<TikTokClient> logger)
    {
        _http = http;
        _config = config;
        _tokenService = tokenService;
        _cache = cache;
        _logger = logger;
    }

    public string BuildOAuthUrl(string redirectUri, string state)
    {
        var clientKey = _config["SocialMedia:TikTok:ClientKey"];
        var scopes = "video.publish,video.upload,user.info.basic";

        return $"https://www.tiktok.com/v2/auth/authorize/" +
               $"?client_key={clientKey}" +
               $"&scope={Uri.EscapeDataString(scopes)}" +
               $"&response_type=code" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&state={state}";
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri, string? state = null)
    {
        try
        {
            var clientKey = _config["SocialMedia:TikTok:ClientKey"];
            var clientSecret = _config["SocialMedia:TikTok:ClientSecret"];

            var body = new
            {
                client_key = clientKey,
                client_secret = clientSecret,
                code,
                grant_type = "authorization_code",
                redirect_uri = redirectUri
            };

            var request = new HttpRequestMessage(HttpMethod.Post,
                $"{ApiBase}/v2/oauth/token/");
            request.Content = new StringContent(
                JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            var data = await response.Content.ReadFromJsonAsync<JsonElement>();

            var accessToken = data.GetProperty("access_token").GetString()!;
            var refreshToken = data.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;
            var expiresIn = data.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 86400; // 24hrs
            var openId = data.TryGetProperty("open_id", out var oid) ? oid.GetString() : null;

            // Fetch user info
            var userRequest = new HttpRequestMessage(HttpMethod.Get,
                $"{ApiBase}/v2/user/info/?fields=display_name,avatar_url");
            userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var userResponse = await _http.SendAsync(userRequest);
            var userData = await userResponse.Content.ReadFromJsonAsync<JsonElement>();

            string? displayName = null;
            if (userData.TryGetProperty("data", out var userDataProp) &&
                userDataProp.TryGetProperty("user", out var user))
            {
                displayName = user.TryGetProperty("display_name", out var dn) ? dn.GetString() : null;
            }

            return new OAuthTokenResult(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: displayName ?? "TikTok Account",
                AccountId: openId,
                PageId: openId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TikTok OAuth token exchange failed");
            return new OAuthTokenResult("", null, null, null, null, null, Error: ex.Message);
        }
    }

    public async Task<PostResult> PublishPostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);

            // TikTok Content Posting API is video-only
            if (request.MediaType == "Text" || string.IsNullOrWhiteSpace(request.MediaType))
            {
                return new PostResult(false, PlatformName, null,
                    Error: "TikTok requires video content. Text-only posts are not supported.");
            }

            // Initialize video publish
            var body = new
            {
                post_info = new
                {
                    title = request.Caption?.Length > 150 ? request.Caption[..150] : request.Caption,
                    privacy_level = "PUBLIC_TO_EVERYONE"
                },
                source_info = new
                {
                    source = "PULL_FROM_URL"
                }
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                $"{ApiBase}/v2/post/publish/video/init/");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            httpRequest.Content = new StringContent(
                JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(httpRequest);

            if (response.IsSuccessStatusCode)
            {
                var data = await response.Content.ReadFromJsonAsync<JsonElement>();
                var publishId = data.TryGetProperty("data", out var d) &&
                                d.TryGetProperty("publish_id", out var pid) ? pid.GetString() : null;
                return new PostResult(true, PlatformName, publishId,
                    Error: "Video upload initiated. Check TikTok for publish status.");
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            return new PostResult(false, PlatformName, null,
                Error: $"TikTok publish initiation failed: {errorBody}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TikTok publish failed");
            return new PostResult(false, PlatformName, null, Error: ex.Message);
        }
    }

    public Task<PostResult> SchedulePostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        return Task.FromResult(new PostResult(
            false, PlatformName, null,
            Error: "TikTok doesn't support scheduled publishing via API."));
    }

    public Task<List<CommentDto>> GetCommentsAsync(SocialMediaAccount account, int maxResults = 50)
    {
        // TikTok Content Posting API doesn't include comment reading
        return Task.FromResult(new List<CommentDto>());
    }

    public Task<bool> ReplyToCommentAsync(SocialMediaAccount account, string commentId, string message)
    {
        // TikTok doesn't expose comment reply via Content Posting API
        return Task.FromResult(false);
    }

    public async Task<OAuthTokenResult?> RefreshTokenAsync(SocialMediaAccount account)
    {
        if (string.IsNullOrEmpty(account.EncryptedRefreshToken))
            return null;

        try
        {
            var clientKey = _config["SocialMedia:TikTok:ClientKey"];
            var clientSecret = _config["SocialMedia:TikTok:ClientSecret"];
            var refreshToken = _tokenService.Decrypt(account.EncryptedRefreshToken);

            var body = new
            {
                client_key = clientKey,
                client_secret = clientSecret,
                grant_type = "refresh_token",
                refresh_token = refreshToken
            };

            var request = new HttpRequestMessage(HttpMethod.Post,
                $"{ApiBase}/v2/oauth/token/");
            request.Content = new StringContent(
                JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            var data = await response.Content.ReadFromJsonAsync<JsonElement>();

            var newToken = data.GetProperty("access_token").GetString()!;
            var newRefresh = data.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : refreshToken;
            var expiresIn = data.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 86400;

            return new OAuthTokenResult(
                AccessToken: newToken,
                RefreshToken: newRefresh,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: account.AccountName,
                AccountId: account.AccountId,
                PageId: account.PageId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TikTok token refresh failed");
            return null;
        }
    }
}
