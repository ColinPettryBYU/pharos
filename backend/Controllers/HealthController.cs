using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/health-records")]
[Authorize(Roles = "Admin")]
public class HealthController : ControllerBase
{
    private readonly IResidentService _service;

    public HealthController(IResidentService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<HealthRecordDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] int? residentId = null)
    {
        var result = await _service.GetHealthRecordsAsync(page, pageSize, residentId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<HealthRecordDto>> Create([FromBody] CreateHealthRecordRequest request)
    {
        var result = await _service.CreateHealthRecordAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HealthRecordDto>> Update(int id, [FromBody] UpdateHealthRecordRequest request)
    {
        var result = await _service.UpdateHealthRecordAsync(id, request);
        if (result == null) return NotFound(new { message = "Health record not found." });
        return Ok(result);
    }
}
