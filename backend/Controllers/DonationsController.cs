using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/donations")]
[Authorize(Roles = "Admin")]
public class DonationsController : ControllerBase
{
    private readonly IDonorService _service;

    public DonationsController(IDonorService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<DonationDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? donationType = null,
        [FromQuery] string? campaignName = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetDonationsAsync(page, pageSize, donationType, campaignName, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<DonationDetailDto>> GetById(int id)
    {
        var result = await _service.GetDonationByIdAsync(id);
        if (result == null) return NotFound(new { message = "Donation not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<DonationDto>> Create([FromBody] CreateDonationRequest request)
    {
        var result = await _service.CreateDonationAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.DonationId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DonationDto>> Update(int id, [FromBody] UpdateDonationRequest request)
    {
        var result = await _service.UpdateDonationAsync(id, request);
        if (result == null) return NotFound(new { message = "Donation not found." });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteDonationAsync(id);
        if (!deleted) return NotFound(new { message = "Donation not found." });
        return Ok(new { message = "Donation deleted successfully." });
    }
}

[ApiController]
[Route("api/admin/donation-allocations")]
[Authorize(Roles = "Admin")]
public class DonationAllocationsController : ControllerBase
{
    private readonly IDonorService _service;

    public DonationAllocationsController(IDonorService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<DonationAllocationDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? safehouseId = null)
    {
        var result = await _service.GetAllocationsAsync(page, pageSize, safehouseId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<DonationAllocationDto>> Create([FromBody] CreateDonationAllocationRequest request)
    {
        var result = await _service.CreateAllocationAsync(request);
        return Ok(result);
    }
}
