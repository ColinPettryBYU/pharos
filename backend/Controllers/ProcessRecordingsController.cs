using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/process-recordings")]
[Authorize(Roles = "Admin")]
public class ProcessRecordingsController : ControllerBase
{
    private readonly IResidentService _service;

    public ProcessRecordingsController(IResidentService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<ProcessRecordingDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? residentId = null,
        [FromQuery] string? sessionType = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetProcessRecordingsAsync(page, pageSize, residentId, sessionType, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<ProcessRecordingDto>> GetById(int id)
    {
        var result = await _service.GetProcessRecordingByIdAsync(id);
        if (result == null) return NotFound(new { message = "Process recording not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ProcessRecordingDto>> Create([FromBody] CreateProcessRecordingRequest request)
    {
        var result = await _service.CreateProcessRecordingAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.RecordingId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ProcessRecordingDto>> Update(int id, [FromBody] UpdateProcessRecordingRequest request)
    {
        var result = await _service.UpdateProcessRecordingAsync(id, request);
        if (result == null) return NotFound(new { message = "Process recording not found." });
        return Ok(result);
    }
}
