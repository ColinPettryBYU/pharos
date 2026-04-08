using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UsersController(UserManager<ApplicationUser> userManager) => _userManager = userManager;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserManagementDto>>> GetAll()
    {
        var users = await _userManager.Users.ToListAsync();
        var result = new List<UserManagementDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var mfaEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
            var isLockedOut = await _userManager.IsLockedOutAsync(user);

            result.Add(new UserManagementDto(
                user.Id, user.Email, user.DisplayName, roles,
                user.LinkedSupporterId, mfaEnabled, isLockedOut));
        }

        return Ok(result);
    }

    [HttpPut("{id}/roles")]
    public async Task<IActionResult> UpdateRoles(string id, [FromBody] UpdateUserRolesRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRolesAsync(user, request.Roles);

        return Ok(new { message = "Roles updated successfully." });
    }

    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> UnlockUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.ResetAccessFailedCountAsync(user);

        return Ok(new { message = "User account unlocked." });
    }

    [HttpPost("invite")]
    public async Task<IActionResult> InviteUser([FromBody] InviteUserRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            return BadRequest(new { message = "A user with this email already exists." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
            LinkedSupporterId = request.LinkedSupporterId
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to create user.", errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, request.Role);

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserManagementDto(
            user.Id, user.Email, user.DisplayName, roles,
            user.LinkedSupporterId, false, false));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to delete user.", errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "User deleted successfully." });
    }
}
