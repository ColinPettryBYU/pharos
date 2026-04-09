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
    [Authorize(Roles = "Admin,Staff")]
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
    [Authorize(Roles = "Admin,Staff")]
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

    // ── Comments Inbox ──

    [HttpGet("comments/inbox")]
    [Authorize(Roles = "Admin,Staff")]
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
    [Authorize(Roles = "Admin,Staff")]
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
    [Authorize(Roles = "Admin,Staff")]
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
