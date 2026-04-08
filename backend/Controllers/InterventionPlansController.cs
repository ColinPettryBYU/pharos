using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/intervention-plans")]
[Authorize(Roles = "Admin")]
public class InterventionPlansController : ControllerBase
{
    private readonly IResidentService _service;

    public InterventionPlansController(IResidentService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<InterventionPlanDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] int? residentId = null,
        [FromQuery] string? status = null)
    {
        var result = await _service.GetInterventionPlansAsync(page, pageSize, residentId, status);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<InterventionPlanDto>> Create([FromBody] CreateInterventionPlanRequest request)
    {
        var result = await _service.CreateInterventionPlanAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InterventionPlanDto>> Update(int id, [FromBody] UpdateInterventionPlanRequest request)
    {
        var result = await _service.UpdateInterventionPlanAsync(id, request);
        if (result == null) return NotFound(new { message = "Intervention plan not found." });
        return Ok(result);
    }
}
