using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/education-records")]
[Authorize(Roles = "Admin")]
public class EducationController : ControllerBase
{
    private readonly IResidentService _service;

    public EducationController(IResidentService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<EducationRecordDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] int? residentId = null)
    {
        var result = await _service.GetEducationRecordsAsync(page, pageSize, residentId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<EducationRecordDto>> Create([FromBody] CreateEducationRecordRequest request)
    {
        var result = await _service.CreateEducationRecordAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EducationRecordDto>> Update(int id, [FromBody] UpdateEducationRecordRequest request)
    {
        var result = await _service.UpdateEducationRecordAsync(id, request);
        if (result == null) return NotFound(new { message = "Education record not found." });
        return Ok(result);
    }
}
