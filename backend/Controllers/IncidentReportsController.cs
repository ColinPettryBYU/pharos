using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/incident-reports")]
[Authorize(Roles = "Admin")]
public class IncidentReportsController : ControllerBase
{
    private readonly IResidentService _service;

    public IncidentReportsController(IResidentService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<IncidentReportDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] int? residentId = null,
        [FromQuery] string? severity = null,
        [FromQuery] string? incidentType = null)
    {
        var result = await _service.GetIncidentReportsAsync(page, pageSize, residentId, severity, incidentType);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<IncidentReportDto>> Create([FromBody] CreateIncidentReportRequest request)
    {
        var result = await _service.CreateIncidentReportAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<IncidentReportDto>> Update(int id, [FromBody] UpdateIncidentReportRequest request)
    {
        var result = await _service.UpdateIncidentReportAsync(id, request);
        if (result == null) return NotFound(new { message = "Incident report not found." });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteIncidentReportAsync(id);
        if (!deleted) return NotFound(new { message = "Incident report not found." });
        return Ok(new { message = "Incident report deleted successfully." });
    }
}
