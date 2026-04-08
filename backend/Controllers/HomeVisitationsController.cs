using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/home-visitations")]
[Authorize(Roles = "Admin")]
public class HomeVisitationsController : ControllerBase
{
    private readonly IResidentService _service;

    public HomeVisitationsController(IResidentService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<HomeVisitationDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] int? residentId = null,
        [FromQuery] string? visitType = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetHomeVisitationsAsync(page, pageSize, residentId, visitType, search);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<HomeVisitationDto>> Create([FromBody] CreateHomeVisitationRequest request)
    {
        var result = await _service.CreateHomeVisitationAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HomeVisitationDto>> Update(int id, [FromBody] UpdateHomeVisitationRequest request)
    {
        var result = await _service.UpdateHomeVisitationAsync(id, request);
        if (result == null) return NotFound(new { message = "Home visitation not found." });
        return Ok(result);
    }
}
