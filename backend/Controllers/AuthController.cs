using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
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

        // Auto-login after registration
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

    [HttpPost("google-login")]
    public IActionResult GoogleLogin()
    {
        // Placeholder: Google OAuth will be handled by the challenge/callback flow
        // The actual implementation requires frontend to redirect to Google and then
        // the callback to be handled by the ASP.NET Google authentication handler
        var redirectUrl = Url.Action("GoogleCallback", "Auth");
        var properties = new Microsoft.AspNetCore.Authentication.AuthenticationProperties
        {
            RedirectUri = redirectUrl
        };
        return Challenge(properties, "Google");
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
            return Redirect("/login?error=google-failed");

        // Attempt sign-in with external login
        var result = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: true);

        if (result.Succeeded)
        {
            return Redirect("/");
        }

        // If user doesn't exist, create account from Google info
        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        var name = info.Principal.FindFirstValue(ClaimTypes.Name);

        if (email == null)
            return Redirect("/login?error=no-email");

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = name,
            EmailConfirmed = true
        };

        var createResult = await _userManager.CreateAsync(user);
        if (createResult.Succeeded)
        {
            await _userManager.AddLoginAsync(user, info);
            await _signInManager.SignInAsync(user, isPersistent: true);
            return Redirect("/");
        }

        return Redirect("/login?error=creation-failed");
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

    [HttpPost("change-password")]
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
}
