using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/residents")]
[Authorize(Roles = "Admin")]
public class ResidentsController : ControllerBase
{
    private readonly IResidentService _service;

    public ResidentsController(IResidentService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<ResidentDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] string? caseStatus = null,
        [FromQuery] string? riskLevel = null,
        [FromQuery] int? safehouseId = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, caseStatus, riskLevel, safehouseId, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ResidentDetailDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(new { message = "Resident not found." });
        return Ok(result);
    }

    [HttpGet("{id}/summary")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ResidentSummaryDto>> GetSummary(int id)
    {
        var result = await _service.GetSummaryAsync(id);
        if (result == null) return NotFound(new { message = "Resident not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ResidentDto>> Create([FromBody] CreateResidentRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.ResidentId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ResidentDto>> Update(int id, [FromBody] UpdateResidentRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        if (result == null) return NotFound(new { message = "Resident not found." });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound(new { message = "Resident not found." });
        return Ok(new { message = "Resident deleted successfully." });
    }

    // ── Nested Process Recordings for a specific resident ──

    [HttpGet("{id}/process-recordings")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<ProcessRecordingDto>>> GetResidentProcessRecordings(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500)
    {
        var result = await _service.GetProcessRecordingsAsync(page, pageSize, residentId: id, null, null);
        return Ok(result);
    }

    [HttpGet("{id}/home-visitations")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<HomeVisitationDto>>> GetResidentHomeVisitations(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500)
    {
        var result = await _service.GetHomeVisitationsAsync(page, pageSize, residentId: id, null, null);
        return Ok(result);
    }
}
