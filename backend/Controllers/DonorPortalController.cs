using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Models;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/donor")]
[Authorize(Roles = "Donor")]
public class DonorPortalController : ControllerBase
{
    private readonly IDonorService _donorService;
    private readonly UserManager<ApplicationUser> _userManager;

    public DonorPortalController(IDonorService donorService, UserManager<ApplicationUser> userManager)
    {
        _donorService = donorService;
        _userManager = userManager;
    }

    private async Task<int?> GetLinkedSupporterId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return null;
        var user = await _userManager.FindByIdAsync(userId);
        return user?.LinkedSupporterId;
    }

    [HttpGet("my-profile")]
    public async Task<ActionResult<DonorProfileDto>> GetMyProfile()
    {
        var supporterId = await GetLinkedSupporterId();
        if (!supporterId.HasValue) return NotFound(new { message = "No linked supporter profile found." });

        var result = await _donorService.GetDonorProfileAsync(supporterId.Value);
        if (result == null) return NotFound(new { message = "Supporter profile not found." });
        return Ok(result);
    }

    [HttpGet("my-donations")]
    public async Task<ActionResult<PagedResult<DonationDto>>> GetMyDonations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500)
    {
        var supporterId = await GetLinkedSupporterId();
        if (!supporterId.HasValue) return NotFound(new { message = "No linked supporter profile found." });

        var result = await _donorService.GetDonorDonationsAsync(supporterId.Value, page, pageSize);
        return Ok(result);
    }

    [HttpGet("my-impact")]
    public async Task<ActionResult<DonorImpactDto>> GetMyImpact()
    {
        var supporterId = await GetLinkedSupporterId();
        if (!supporterId.HasValue) return NotFound(new { message = "No linked supporter profile found." });

        var result = await _donorService.GetDonorImpactAsync(supporterId.Value);
        if (result == null) return NotFound(new { message = "Impact data not found." });
        return Ok(result);
    }
}
