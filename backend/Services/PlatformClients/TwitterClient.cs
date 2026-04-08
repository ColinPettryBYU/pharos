using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services.PlatformClients;

public class TwitterClient : ISocialPlatformClient
{
    // Twitter/X API v2 — pay-per-use (~$0.01/tweet). Track spend, warn in UI.
    private const string ApiBase = "https://api.x.com";

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _tokenService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<TwitterClient> _logger;
    private string? _overrideClientId;
    private string? _overrideClientSecret;

    public string PlatformName => "Twitter";

    public TwitterClient(
        HttpClient http,
        IConfiguration config,
        ITokenEncryptionService tokenService,
        IMemoryCache cache,
        ILogger<TwitterClient> logger)
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

    private string? ResolveClientId() => _overrideClientId ?? _config["SocialMedia:Twitter:ClientId"];
    private string? ResolveClientSecret() => _overrideClientSecret ?? _config["SocialMedia:Twitter:ClientSecret"];

    public string BuildOAuthUrl(string redirectUri, string state)
    {
        var clientId = ResolveClientId();
        var scopes = "tweet.write tweet.read users.read offline.access";

        // OAuth 2.0 with PKCE
        var codeVerifier = GenerateCodeVerifier();
        var codeChallenge = GenerateCodeChallenge(codeVerifier);

        // Store code_verifier in cache for callback retrieval
        _cache.Set($"twitter_pkce_{state}", codeVerifier, TimeSpan.FromMinutes(10));

        return $"https://twitter.com/i/oauth2/authorize" +
               $"?response_type=code" +
               $"&client_id={clientId}" +
               $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
               $"&scope={Uri.EscapeDataString(scopes)}" +
               $"&state={state}" +
               $"&code_challenge={codeChallenge}" +
               $"&code_challenge_method=S256";
    }

    public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri, string? state = null)
    {
        try
        {
            var clientId = ResolveClientId();
            var clientSecret = ResolveClientSecret();

            var codeVerifier = state != null
                ? _cache.Get<string>($"twitter_pkce_{state}") ?? "challenge"
                : "challenge";

            var authHeader = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

            var request = new HttpRequestMessage(HttpMethod.Post,
                $"{ApiBase}/2/oauth2/token");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["grant_type"] = "authorization_code",
                ["redirect_uri"] = redirectUri,
                ["code_verifier"] = codeVerifier
            });

            var response = await _http.SendAsync(request);
            var data = await response.Content.ReadFromJsonAsync<JsonElement>();

            var accessToken = data.GetProperty("access_token").GetString()!;
            var refreshToken = data.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;
            var expiresIn = data.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 7200;

            // Fetch user info
            var userRequest = new HttpRequestMessage(HttpMethod.Get, $"{ApiBase}/2/users/me");
            userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var userResponse = await _http.SendAsync(userRequest);
            var userData = await userResponse.Content.ReadFromJsonAsync<JsonElement>();

            string? username = null;
            string? userId = null;
            if (userData.TryGetProperty("data", out var userObj))
            {
                username = userObj.TryGetProperty("username", out var un) ? un.GetString() : null;
                userId = userObj.TryGetProperty("id", out var uid) ? uid.GetString() : null;
            }

            return new OAuthTokenResult(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                ExpiresAt: DateTime.UtcNow.AddSeconds(expiresIn),
                AccountName: username != null ? $"@{username}" : "Twitter Account",
                AccountId: userId,
                PageId: userId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Twitter OAuth token exchange failed");
            return new OAuthTokenResult("", null, null, null, null, null, Error: ex.Message);
        }
    }

    public async Task<PostResult> PublishPostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        try
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);
            var caption = BuildCaption(request);

            // Twitter character limit: 280 for free, 25000 for premium
            if (caption.Length > 280)
            {
                _logger.LogWarning("Tweet exceeds 280 chars ({Length}), truncating", caption.Length);
                caption = caption[..277] + "...";
            }

            var body = new { text = caption };
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{ApiBase}/2/tweets");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            httpRequest.Content = new StringContent(
                JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(httpRequest);
            var result = await response.Content.ReadFromJsonAsync<JsonElement>();

            if (result.TryGetProperty("data", out var tweetData))
            {
                var tweetId = tweetData.GetProperty("id").GetString();
                return new PostResult(true, PlatformName, tweetId,
                    $"https://twitter.com/i/status/{tweetId}");
            }

            var error = result.TryGetProperty("detail", out var detail)
                ? detail.GetString() : "Unknown error";
            return new PostResult(false, PlatformName, null, Error: error);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Twitter publish failed");
            return new PostResult(false, PlatformName, null, Error: ex.Message);
        }
    }

    public Task<PostResult> SchedulePostAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        // Twitter API v2 doesn't support scheduled tweets
        return Task.FromResult(new PostResult(
            false, PlatformName, null,
            Error: "Twitter API doesn't support scheduled tweets. Post saved as draft."));
    }

    public Task<List<CommentDto>> GetCommentsAsync(SocialMediaAccount account, int maxResults = 50)
    {
        // Twitter reply fetching is expensive (search API) — not included for cost reasons
        return Task.FromResult(new List<CommentDto>());
    }

    public Task<bool> ReplyToCommentAsync(SocialMediaAccount account, string commentId, string message)
    {
        // Would use POST /2/tweets with reply.in_reply_to_tweet_id — not implemented for cost
        return Task.FromResult(false);
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

            var authHeader = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

            var request = new HttpRequestMessage(HttpMethod.Post,
                $"{ApiBase}/2/oauth2/token");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = refreshToken
            });

            var response = await _http.SendAsync(request);
            var data = await response.Content.ReadFromJsonAsync<JsonElement>();

            var newToken = data.GetProperty("access_token").GetString()!;
            var newRefresh = data.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : refreshToken;
            var expiresIn = data.TryGetProperty("expires_in", out var exp) ? exp.GetInt64() : 7200;

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
            _logger.LogError(ex, "Twitter token refresh failed");
            return null;
        }
    }

    private static string BuildCaption(ComposePostRequest request)
    {
        var caption = request.Caption;
        if (!string.IsNullOrWhiteSpace(request.Hashtags))
            caption += " " + request.Hashtags;
        return caption;
    }

    private static string GenerateCodeVerifier()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string GenerateCodeChallenge(string verifier)
    {
        var bytes = SHA256.HashData(Encoding.ASCII.GetBytes(verifier));
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
