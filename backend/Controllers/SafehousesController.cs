using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/safehouses")]
[Authorize(Roles = "Admin")]
public class SafehousesController : ControllerBase
{
    private readonly ISafehouseService _service;

    public SafehousesController(ISafehouseService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<SafehouseDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, status, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SafehouseDetailDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound(new { message = "Safehouse not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<SafehouseDto>> Create([FromBody] CreateSafehouseRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.SafehouseId }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SafehouseDto>> Update(int id, [FromBody] UpdateSafehouseRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        if (result == null) return NotFound(new { message = "Safehouse not found." });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound(new { message = "Safehouse not found." });
        return Ok(new { message = "Safehouse deleted successfully." });
    }
}
