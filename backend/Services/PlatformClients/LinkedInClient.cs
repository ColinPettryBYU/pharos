using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services.PlatformClients;

public class LinkedInClient : ISocialPlatformClient
{
    private const string ApiBase = "https://api.linkedin.com";
    // Rate limit: 100 calls/day for Community Management API — cache aggressively
    private const int CommentCacheMinutes = 15;

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _tokenService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<LinkedInClient> _logger;
    private string? _overrideClientId;
    private string? _overrideClientSecret;

    public string PlatformName => "LinkedIn";

    public LinkedInClient(
        HttpClient http,
        IConfiguration config,
        ITokenEncryptionService tokenService,
        IMemoryCache cache,
        ILogger<LinkedInClient> logger)
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

    private string? ResolveClientId() => _overrideClientId ?? _config["SocialMedia:LinkedIn:ClientId"];
    private string? ResolveClientSecret() => _overrideClientSecret ?? _config["SocialMedia:LinkedIn:ClientSecret"];

    public string BuildOAuthUrl(string redirectUri, string state)
    {
        var clientId = ResolveClientId();
        var scopes = "r_organization_social w_organization_social rw_organization_admin";

        return $"https://www.linkedin.com/oauth/v2/authorization" +
               $"?response_type=code" +
               $"&client_id={clientId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&scope={Uri.EscapeDataString(scopes)}" +
               $"&state={state}";
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri, string? state = null)
    {
        try
        {
            var clientId = ResolveClientId();
            var clientSecret = ResolveClientSecret();

            var tokenResponse = await _http.PostAsync(
                "https://www.linkedin.com/oauth/v2/accessToken",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["grant_type"] = "authorization_code",
                    ["code"] = code,
                    ["redirect_uri"] = redirectUri,
                    ["client_id"] = clientId!,
                    ["client_secret"] = clientSecret!
                }));

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<JsonElement>();
            var accessToken = tokenData.GetProperty("access_token").GetString()!;
            var expiresIn = tokenData.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 5184000;
            var refreshToken = tokenData.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;

            // Get organization URN via organization ACLs
            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{ApiBase}/v2/organizationAcls?q=roleAssignee&projection=(elements*(organization~(localizedName)))");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var orgResponse = await _http.SendAsync(request);
            var orgData = await orgResponse.Content.ReadFromJsonAsync<JsonElement>();

            string? orgUrn = null;
            string? orgName = null;

            if (orgData.TryGetProperty("elements", out var elements) && elements.GetArrayLength() > 0)
            {
                var first = elements[0];
                if (first.TryGetProperty("organization", out var org))
                    orgUrn = org.GetString();
                if (first.TryGetProperty("organization~", out var orgTilde))
                    orgName = orgTilde.GetProperty("localizedName").GetString();
            }

            return new OAuthTokenResult(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: orgName ?? "LinkedIn Organization",
                AccountId: orgUrn,
                PageId: orgUrn
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LinkedIn OAuth token exchange failed");
            return new OAuthTokenResult("", null, null, null, null, null, Error: ex.Message);
        }
    }

    public async Task<PostResult> PublishPostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var orgUrn = account.PageId ?? account.AccountId;

            var postBody = new
            {
                author = orgUrn,
                commentary = BuildCaption(request),
                visibility = "PUBLIC",
                distribution = new
                {
                    feedDistribution = "MAIN_FEED",
                    targetEntities = Array.Empty<object>(),
                    thirdPartyDistributionChannels = Array.Empty<object>()
                },
                lifecycleState = "PUBLISHED"
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{ApiBase}/rest/posts");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            httpRequest.Headers.Add("LinkedIn-Version", "202401");
            httpRequest.Headers.Add("X-Restli-Protocol-Version", "2.0.0");
            httpRequest.Content = new StringContent(
                JsonSerializer.Serialize(postBody), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(httpRequest);

            if (response.IsSuccessStatusCode)
            {
                var postUrn = response.Headers.TryGetValues("x-restli-id", out var ids)
                    ? ids.FirstOrDefault() : null;
                return new PostResult(true, PlatformName, postUrn,
                    postUrn != null ? $"https://www.linkedin.com/feed/update/{postUrn}" : null);
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("LinkedIn publish failed: {StatusCode} {Body}", response.StatusCode, errorBody);
            return new PostResult(false, PlatformName, null, Error: $"HTTP {(int)response.StatusCode}: {errorBody}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LinkedIn publish failed");
            return new PostResult(false, PlatformName, null, Error: ex.Message);
        }
    }

    public Task<PostResult> SchedulePostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        // LinkedIn Community Management API doesn't support scheduled posts
        return Task.FromResult(new PostResult(
            true, PlatformName, null,
            Error: "LinkedIn doesn't support native scheduling. Post saved as draft."));
    }

    public async Task<List<CommentDto>> GetCommentsAsync(SocialMediaAccount account, int maxResults = 50)
    {
        var cacheKey = $"li_comments_{account.Id}";
        if (_cache.TryGetValue(cacheKey, out List<CommentDto>? cached) && cached != null)
            return cached;

        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var orgUrn = account.PageId ?? account.AccountId;

            var request = new HttpRequestMessage(HttpMethod.Get,
                $"{ApiBase}/rest/socialActions/{Uri.EscapeDataString(orgUrn!)}/comments?count={maxResults}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("LinkedIn-Version", "202401");

            var response = await _http.SendAsync(request);
            var data = await response.Content.ReadFromJsonAsync<JsonElement>();

            var comments = new List<CommentDto>();
            if (data.TryGetProperty("elements", out var elements))
            {
                foreach (var c in elements.EnumerateArray())
                {
                    comments.Add(new CommentDto(
                        CommentId: c.TryGetProperty("$URN", out var urn) ? urn.GetString()! : Guid.NewGuid().ToString(),
                        Platform: PlatformName,
                        PostId: orgUrn,
                        CommenterName: c.TryGetProperty("actor~", out var actor)
                            ? actor.GetProperty("localizedFirstName").GetString() + " " +
                              actor.GetProperty("localizedLastName").GetString()
                            : "LinkedIn User",
                        CommentText: c.TryGetProperty("message", out var msg)
                            ? msg.GetProperty("text").GetString()! : "",
                        CreatedAt: c.TryGetProperty("created", out var created)
                            ? DateTimeOffset.FromUnixTimeMilliseconds(created.GetProperty("time").GetInt64()).UtcDateTime
                            : DateTime.UtcNow,
                        IsRead: false
                    ));
                }
            }

            _cache.Set(cacheKey, comments, TimeSpan.FromMinutes(CommentCacheMinutes));
            return comments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LinkedIn comment fetch failed");
            return [];
        }
    }

    public async Task<bool> ReplyToCommentAsync(SocialMediaAccount account, string commentId, string message)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);

            var body = new { actor = account.PageId, message = new { text = message } };
            var request = new HttpRequestMessage(HttpMethod.Post,
                $"{ApiBase}/rest/socialActions/{Uri.EscapeDataString(commentId)}/comments");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("LinkedIn-Version", "202401");
            request.Content = new StringContent(
                JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LinkedIn reply failed for comment {CommentId}", commentId);
            return false;
        }
    }

    public async Task<OAuthTokenResult?> RefreshTokenAsync(SocialMediaAccount account)
    {
        if (string.IsNullOrEmpty(account.EncryptedRefreshToken))
            return null;

        try
        {
            var clientId = ResolveClientId();
            var clientSecret = ResolveClientSecret();
            var refreshToken = _tokenService.Decrypt(account.EncryptedRefreshToken);

            var response = await _http.PostAsync(
                "https://www.linkedin.com/oauth/v2/accessToken",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["grant_type"] = "refresh_token",
                    ["refresh_token"] = refreshToken,
                    ["client_id"] = clientId!,
                    ["client_secret"] = clientSecret!
                }));

            var data = await response.Content.ReadFromJsonAsync<JsonElement>();
            var newToken = data.GetProperty("access_token").GetString()!;
            var expiresIn = data.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 5184000;

            return new OAuthTokenResult(
                AccessToken: newToken,
                RefreshToken: data.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : refreshToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: account.AccountName,
                AccountId: account.AccountId,
                PageId: account.PageId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LinkedIn token refresh failed");
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
