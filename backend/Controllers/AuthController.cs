using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration config,
        IMemoryCache cache)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
        _cache = cache;
    }

    private string GetFrontendUrl()
    {
        var url = _config["FrontendUrl"];
        if (!string.IsNullOrEmpty(url)) return url;

        return _config.GetSection("AllowedOrigins").Get<string[]>()?.FirstOrDefault()
            ?? "https://pharos-snowy.vercel.app";
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Unauthorized(new LoginResponse(false, "Invalid email or password."));

        var result = await _signInManager.PasswordSignInAsync(
            user, request.Password, isPersistent: true, lockoutOnFailure: true);

        if (result.RequiresTwoFactor)
        {
            return Ok(new LoginResponse(false, "MFA required.", RequiresMfa: true));
        }

        if (result.IsLockedOut)
        {
            return Unauthorized(new LoginResponse(false, "Account locked. Try again later."));
        }

        if (!result.Succeeded)
        {
            return Unauthorized(new LoginResponse(false, "Invalid email or password."));
        }

        var roles = await _userManager.GetRolesAsync(user);
        var mfaEnabled = await _userManager.GetTwoFactorEnabledAsync(user);

        return Ok(new LoginResponse(true, "Login successful.", User: new UserInfoDto(
            user.Id, user.Email!, user.DisplayName, roles,
            user.LinkedSupporterId, mfaEnabled)));
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register([FromBody] RegisterRequest request)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            return BadRequest(new LoginResponse(false, "Registration failed.", User: null)
            {
            });
        }

        await _userManager.AddToRoleAsync(user, "Donor");

        await _signInManager.SignInAsync(user, isPersistent: true);

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new LoginResponse(true, "Registration successful.", User: new UserInfoDto(
            user.Id, user.Email!, user.DisplayName, roles, null, false)));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserInfoDto?>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Ok(new { user = (UserInfoDto?)null });

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Ok(new { user = (UserInfoDto?)null });

        var roles = await _userManager.GetRolesAsync(user);
        var mfaEnabled = await _userManager.GetTwoFactorEnabledAsync(user);

        return Ok(new
        {
            user = new UserInfoDto(
                user.Id, user.Email!, user.DisplayName, roles,
                user.LinkedSupporterId, mfaEnabled)
        });
    }

    [HttpGet("google-login")]
    public async Task<IActionResult> GoogleLogin(
        [FromServices] IAuthenticationSchemeProvider schemeProvider)
    {
        var scheme = await schemeProvider.GetSchemeAsync("Google");
        if (scheme == null)
        {
            return Redirect($"{GetFrontendUrl()}/login?error=google-not-configured");
        }

        var redirectUrl = Url.Action("GoogleCallback", "Auth");
        var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl);
        return Challenge(properties, "Google");
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback(
        [FromServices] ILoggerFactory loggerFactory)
    {
        var log = loggerFactory.CreateLogger("GoogleCallback");
        var frontendUrl = GetFrontendUrl();

        var hasExternalCookie = Request.Cookies.ContainsKey("Identity.External");
        log.LogWarning("GoogleCallback entered. Identity.External cookie present: {Has}", hasExternalCookie);

        var authResult = await HttpContext.AuthenticateAsync(IdentityConstants.ExternalScheme);
        log.LogWarning("AuthenticateAsync result — Succeeded: {Ok}, Failure: {Fail}, Principal null: {Null}",
            authResult.Succeeded,
            authResult.Failure?.Message,
            authResult.Principal == null);

        if (authResult.Principal != null)
        {
            var claims = authResult.Principal.Claims.Select(c => $"{c.Type}={c.Value}");
            log.LogWarning("Claims: {Claims}", string.Join(" | ", claims));
        }

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
        {
            var detail = !hasExternalCookie
                ? "no-external-cookie"
                : !authResult.Succeeded
                    ? $"auth-failed:{authResult.Failure?.Message ?? "unknown"}"
                    : "info-null-with-valid-auth";

            log.LogError("GetExternalLoginInfoAsync returned null. Detail: {Detail}", detail);
            return Redirect($"{frontendUrl}/login?error=google-failed&detail={Uri.EscapeDataString(detail)}");
        }

        ApplicationUser? user = null;

        var result = await _signInManager.ExternalLoginSignInAsync(
            info.LoginProvider, info.ProviderKey, isPersistent: true);

        if (result.Succeeded)
        {
            user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        }
        else
        {
            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            var name = info.Principal.FindFirstValue(ClaimTypes.Name);

            if (email == null)
                return Redirect($"{frontendUrl}/login?error=no-email");

            user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    DisplayName = name,
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return Redirect($"{frontendUrl}/login?error=creation-failed");

                await _userManager.AddToRoleAsync(user, "Donor");
            }

            await _userManager.AddLoginAsync(user, info);
            await _signInManager.SignInAsync(user, isPersistent: true);
        }

        if (user == null)
            return Redirect($"{frontendUrl}/login?error=google-failed");

        var token = Guid.NewGuid().ToString("N");
        _cache.Set($"google_auth_{token}", user.Id, TimeSpan.FromMinutes(2));
        return Redirect($"{frontendUrl}/login?google_token={token}");
    }

    [HttpPost("exchange-google-token")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> ExchangeGoogleToken(
        [FromBody] ExchangeGoogleTokenRequest request)
    {
        if (!_cache.TryGetValue($"google_auth_{request.Token}", out string? userId)
            || userId == null)
        {
            return Unauthorized(new LoginResponse(false, "Invalid or expired token."));
        }

        _cache.Remove($"google_auth_{request.Token}");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Unauthorized(new LoginResponse(false, "User not found."));

        await _signInManager.SignInAsync(user, isPersistent: true);

        var roles = await _userManager.GetRolesAsync(user);
        var mfaEnabled = await _userManager.GetTwoFactorEnabledAsync(user);

        return Ok(new LoginResponse(true, "Login successful.", User: new UserInfoDto(
            user.Id, user.Email!, user.DisplayName, roles,
            user.LinkedSupporterId, mfaEnabled)));
    }

    // ── MFA Endpoints ──

    [HttpPost("mfa/enable")]
    [Authorize]
    public async Task<ActionResult<MfaSetupDto>> EnableMfa()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var uri = $"otpauth://totp/Pharos:{user.Email}?secret={key}&issuer=Pharos";
        return Ok(new MfaSetupDto(key!, uri));
    }

    [HttpPost("mfa/verify")]
    public async Task<IActionResult> VerifyMfa([FromBody] MfaVerifyRequest request)
    {
        var result = await _signInManager.TwoFactorAuthenticatorSignInAsync(
            request.Code, isPersistent: true, rememberClient: false);

        if (result.Succeeded)
            return Ok(new { success = true, message = "MFA verification successful." });

        return Unauthorized(new { success = false, message = "Invalid verification code." });
    }

    [HttpPost("mfa/confirm-enable")]
    [Authorize]
    public async Task<IActionResult> ConfirmEnableMfa([FromBody] MfaVerifyRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(
            user, _userManager.Options.Tokens.AuthenticatorTokenProvider, request.Code);

        if (!isValid)
            return BadRequest(new { message = "Invalid verification code." });

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return Ok(new { message = "MFA has been enabled." });
    }

    [HttpPost("mfa/disable")]
    [Authorize]
    public async Task<IActionResult> DisableMfa()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);
        return Ok(new { message = "MFA has been disabled." });
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Password change failed.", errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Password changed successfully." });
    }

    [HttpPut("update-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.DisplayName = request.DisplayName;
        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Profile update failed.", errors = result.Errors.Select(e => e.Description) });
        }

        return Ok(new { message = "Profile updated successfully.", display_name = user.DisplayName });
    }
}
