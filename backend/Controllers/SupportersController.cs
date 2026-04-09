using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/supporters")]
[Authorize(Roles = "Admin")]
public class SupportersController : ControllerBase
{
    private readonly IDonorService _service;

    public SupportersController(IDonorService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<SupporterDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] string? supporterType = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetSupportersAsync(page, pageSize, supporterType, status, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SupporterDetailDto>> GetById(int id)
    {
        var result = await _service.GetSupporterByIdAsync(id);
        if (result == null) return NotFound(new { message = "Supporter not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SupporterDto>> Create([FromBody] CreateSupporterRequest request)
    {
        var result = await _service.CreateSupporterAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.SupporterId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SupporterDto>> Update(int id, [FromBody] UpdateSupporterRequest request)
    {
        var result = await _service.UpdateSupporterAsync(id, request);
        if (result == null) return NotFound(new { message = "Supporter not found." });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteSupporterAsync(id);
        if (!deleted) return NotFound(new { message = "Supporter not found." });
        return Ok(new { message = "Supporter deleted successfully." });
    }
}
