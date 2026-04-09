using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;
using Pharos.Api.Services;
using Pharos.Api.Services.PlatformClients;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/social-media")]
[Authorize(Roles = "Admin")]
public class SocialMediaController : ControllerBase
{
    private readonly ISocialMediaService _service;
    private readonly PharosDbContext _db;
    private readonly IPlatformClientFactory _clientFactory;
    private readonly ITokenEncryptionService _tokenService;
    private readonly ISocialCredentialService _credentialService;
    private readonly IConfiguration _config;
    private readonly ILogger<SocialMediaController> _logger;

    public SocialMediaController(
        ISocialMediaService service,
        PharosDbContext db,
        IPlatformClientFactory clientFactory,
        ITokenEncryptionService tokenService,
        ISocialCredentialService credentialService,
        IConfiguration config,
        ILogger<SocialMediaController> logger)
    {
        _service = service;
        _db = db;
        _clientFactory = clientFactory;
        _tokenService = tokenService;
        _credentialService = credentialService;
        _config = config;
        _logger = logger;
    }

    [HttpGet("posts")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<SocialMediaPostDto>>> GetPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] string? platform = null,
        [FromQuery] string? postType = null,
        [FromQuery] string? contentTopic = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetPostsAsync(page, pageSize, platform, postType, contentTopic, search);
        return Ok(result);
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SocialMediaAnalyticsDto>> GetAnalytics(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? platform = null)
    {
        var result = await _service.GetAnalyticsAsync(from, to, platform);
        return Ok(result);
    }

    [HttpPost("compose")]
    public async Task<ActionResult<ComposeResultDto>> Compose([FromBody] ComposePostRequest request)
    {
        var result = await _service.ComposePostAsync(request);
        if (result.Posts.Count == 0 && result.Errors?.Count > 0)
            return BadRequest(new { errors = result.Errors });
        return Ok(result);
    }

    // ── Insights Refresh ──

    [HttpPost("refresh-insights")]
    [AllowAnonymous]
    public async Task<ActionResult> RefreshInsights([FromHeader(Name = "X-Api-Key")] string? apiKey)
    {
        var expectedKey = _config["SocialMedia:InsightsApiKey"];
        if (string.IsNullOrWhiteSpace(expectedKey) || apiKey != expectedKey)
            return Unauthorized(new { error = "Invalid API key" });

        var accounts = await _db.SocialMediaAccounts
            .Where(a => a.Status == "Active" && a.Platform == "Instagram")
            .ToListAsync();

        if (accounts.Count == 0)
            return Ok(new { updated = 0, message = "No active Instagram accounts" });

        var postsToUpdate = await _db.SocialMediaPosts
            .Where(p => p.PlatformPostId != null && p.Platform == "Instagram")
            .OrderByDescending(p => p.CreatedAt)
            .Take(100)
            .ToListAsync();

        // Skip CSV-seeded fake IDs (they start with "ig_"); only real API-published posts have numeric IDs
        var realPosts = postsToUpdate.Where(p =>
            !string.IsNullOrEmpty(p.PlatformPostId) && !p.PlatformPostId.StartsWith("ig_")).ToList();

        _logger.LogInformation("Found {Total} Instagram posts, {Real} with real platform IDs",
            postsToUpdate.Count, realPosts.Count);

        var updated = 0;
        foreach (var account in accounts)
        {
            var token = _tokenService.Decrypt(account.EncryptedAccessToken);

            foreach (var post in realPosts)
            {
                try
                {
                    using var http = new HttpClient();
                    var url = $"https://graph.facebook.com/v21.0/{post.PlatformPostId}" +
                              $"?fields=like_count,comments_count,insights.metric(views,reach,saved,shares)" +
                              $"&access_token={token}";
                    var response = await http.GetFromJsonAsync<System.Text.Json.JsonElement>(url);

                    if (response.TryGetProperty("like_count", out var likes))
                        post.Likes = likes.GetInt32();
                    if (response.TryGetProperty("comments_count", out var comments))
                        post.Comments = comments.GetInt32();

                    if (response.TryGetProperty("insights", out var insights)
                        && insights.TryGetProperty("data", out var insightsData))
                    {
                        foreach (var metric in insightsData.EnumerateArray())
                        {
                            var name = metric.GetProperty("name").GetString();
                            var values = metric.GetProperty("values");
                            var val = values.EnumerateArray().FirstOrDefault();
                            if (val.TryGetProperty("value", out var v))
                            {
                                var intVal = v.GetInt32();
                                switch (name)
                                {
                                    case "views": post.Impressions = intVal; break;
                                    case "reach": post.Reach = intVal; break;
                                    case "saved": post.Saves = intVal; break;
                                    case "shares": post.Shares = intVal; break;
                                }
                            }
                        }
                    }

                    var totalInteractions = (post.Likes ?? 0) + (post.Comments ?? 0) + (post.Shares ?? 0) + (post.Saves ?? 0);
                    if (post.Reach > 0)
                        post.EngagementRate = Math.Round((decimal)totalInteractions / post.Reach.Value, 4);

                    updated++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch insights for post {PostId}", post.PlatformPostId);
                }
            }
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Refreshed insights for {Count} posts", updated);
        return Ok(new { updated, message = $"Updated {updated} posts" });
    }

    // ── Comments Inbox ──

    [HttpGet("comments/inbox")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CommentInboxResponse>> GetCommentInbox(
        [FromQuery] string? platform = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500)
    {
        var result = await _service.GetCommentInboxAsync(platform, page, pageSize);
        return Ok(result);
    }

    [HttpPost("comments/{commentId}/reply")]
    public async Task<IActionResult> ReplyToComment(
        string commentId,
        [FromBody] CommentReplyRequest request,
        [FromQuery] string? platform = null)
    {
        if (string.IsNullOrWhiteSpace(request.ReplyText))
            return BadRequest(new { message = "Reply text is required." });

        // Try to determine platform from commentId pattern or require it as query param
        var targetPlatform = platform ?? DetectPlatformFromCommentId(commentId);
        if (string.IsNullOrWhiteSpace(targetPlatform))
            return BadRequest(new { message = "Platform is required for reply. Pass ?platform=Facebook" });

        var success = await _service.ReplyToCommentAsync(targetPlatform, commentId, request.ReplyText);

        if (success)
            return Ok(new { message = $"Reply sent on {targetPlatform}.", commentId, replyText = request.ReplyText });

        return StatusCode(502, new { message = $"Failed to post reply on {targetPlatform}. The platform may be unavailable." });
    }

    // ── Account Management ──

    [HttpGet("accounts/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPlatformStatus()
    {
        var statuses = await _credentialService.GetCredentialStatusAsync();
        return Ok(statuses);
    }

    [HttpGet("accounts/credentials")]
    public async Task<IActionResult> GetCredentialStatus()
    {
        var statuses = await _credentialService.GetCredentialStatusAsync();
        return Ok(statuses);
    }

    [HttpPost("accounts/credentials/{platform}")]
    public async Task<IActionResult> SaveCredentials(string platform, [FromBody] SaveCredentialsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ClientId) || string.IsNullOrWhiteSpace(request.ClientSecret))
            return BadRequest(new { message = "Both Client ID and Client Secret are required." });

        await _credentialService.SaveCredentialsAsync(platform, request.ClientId, request.ClientSecret);
        _logger.LogInformation("Saved API credentials for {Platform}", platform);
        return Ok(new { message = $"Credentials saved for {platform}." });
    }

    [HttpGet("accounts")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<ConnectedAccountDto>>> GetAccounts()
    {
        var accounts = await _db.SocialMediaAccounts
            .OrderBy(a => a.Platform)
            .Select(a => new ConnectedAccountDto(
                a.Id, a.Platform, a.AccountName, a.AccountId,
                a.ConnectedAt, a.TokenExpiresAt, a.Status))
            .ToListAsync();
        return Ok(accounts);
    }

    [HttpPost("accounts/{platform}/connect")]
    public async Task<IActionResult> ConnectAccount(string platform)
    {
        var client = _clientFactory.GetClient(platform);
        if (client == null)
            return BadRequest(new { message = $"Unsupported platform: {platform}" });

        var (clientId, clientSecret) = await _credentialService.GetCredentialsAsync(platform);
        if (!string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret))
            client.SetCredentialOverrides(clientId, clientSecret);

        var baseUrl = _config["SocialMedia:CallbackBaseUrl"]
            ?? $"{Request.Scheme}://{Request.Host}";
        var redirectUri = $"{baseUrl}/api/admin/social-media/accounts/{platform.ToLowerInvariant()}/callback";

        var state = Guid.NewGuid().ToString("N");

        var oauthUrl = client.BuildOAuthUrl(redirectUri, state);

        return Ok(new OAuthInitiateResponse(oauthUrl));
    }

    [HttpGet("accounts/{platform}/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> OAuthCallback(
        string platform,
        [FromQuery] string code,
        [FromQuery] string? state = null,
        [FromQuery] string? error = null)
    {
        var frontendUrl = _config["SocialMedia:FrontendUrl"] ?? "https://pharos-snowy.vercel.app";

        if (!string.IsNullOrWhiteSpace(error))
        {
            _logger.LogWarning("OAuth error for {Platform}: {Error}", platform, error);
            return Redirect($"{frontendUrl}/admin/settings/social-accounts?error={Uri.EscapeDataString(error)}");
        }

        if (string.IsNullOrWhiteSpace(code))
            return Redirect($"{frontendUrl}/admin/settings/social-accounts?error=missing_code");

        var client = _clientFactory.GetClient(platform);
        if (client == null)
            return Redirect($"{frontendUrl}/admin/settings/social-accounts?error=unsupported_platform");

        var (credClientId, credClientSecret) = await _credentialService.GetCredentialsAsync(platform);
        if (!string.IsNullOrWhiteSpace(credClientId) && !string.IsNullOrWhiteSpace(credClientSecret))
            client.SetCredentialOverrides(credClientId, credClientSecret);

        var baseUrl = _config["SocialMedia:CallbackBaseUrl"]
            ?? $"{Request.Scheme}://{Request.Host}";
        var redirectUri = $"{baseUrl}/api/admin/social-media/accounts/{platform.ToLowerInvariant()}/callback";

        var tokenResult = await client.ExchangeCodeAsync(code, redirectUri, state);

        if (!string.IsNullOrWhiteSpace(tokenResult.Error))
        {
            _logger.LogError("Token exchange failed for {Platform}: {Error}", platform, tokenResult.Error);
            return Redirect($"{frontendUrl}/admin/settings/social-accounts?error={Uri.EscapeDataString(tokenResult.Error)}");
        }

        // Remove any existing account for this platform
        var existing = await _db.SocialMediaAccounts
            .FirstOrDefaultAsync(a => a.Platform.ToLower() == platform.ToLower());
        if (existing != null)
            _db.SocialMediaAccounts.Remove(existing);

        var account = new SocialMediaAccount
        {
            Platform = client.PlatformName,
            AccountName = tokenResult.AccountName ?? $"{platform} Account",
            AccountId = tokenResult.AccountId,
            EncryptedAccessToken = _tokenService.Encrypt(tokenResult.AccessToken),
            EncryptedRefreshToken = tokenResult.RefreshToken != null
                ? _tokenService.Encrypt(tokenResult.RefreshToken) : null,
            ConnectedAt = DateTime.UtcNow,
            TokenExpiresAt = tokenResult.ExpiresAt,
            PageId = tokenResult.PageId,
            Status = "Active"
        };

        _db.SocialMediaAccounts.Add(account);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Connected {Platform} account: {AccountName}", platform, account.AccountName);

        return Redirect($"{frontendUrl}/admin/settings/social-accounts?connected={platform}");
    }

    [HttpDelete("accounts/{platform}")]
    public async Task<IActionResult> DisconnectAccount(string platform)
    {
        var account = await _db.SocialMediaAccounts
            .FirstOrDefaultAsync(a => a.Platform.ToLower() == platform.ToLower() && a.Status == "Active");

        if (account == null)
            return NotFound(new { message = $"No active {platform} account found." });

        _db.SocialMediaAccounts.Remove(account);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Disconnected {Platform} account", platform);

        return Ok(new { message = $"{platform} account disconnected successfully." });
    }

    private static string? DetectPlatformFromCommentId(string commentId)
    {
        if (commentId.Contains("_") && commentId.All(c => char.IsDigit(c) || c == '_'))
            return "Facebook";
        if (commentId.StartsWith("17") && commentId.Length > 15)
            return "Instagram";
        if (commentId.StartsWith("urn:li:"))
            return "LinkedIn";
        if (commentId.Contains("Ug"))
            return "YouTube";
        return null;
    }
}
