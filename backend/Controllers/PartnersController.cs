using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/partners")]
[Authorize(Roles = "Admin")]
public class PartnersController : ControllerBase
{
    private readonly IPartnerService _service;

    public PartnersController(IPartnerService service) => _service = service;

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<PartnerDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? partnerType = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetAllAsync(page, pageSize, partnerType, status, search);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<PartnerDto>> Create([FromBody] CreatePartnerRequest request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PartnerDto>> Update(int id, [FromBody] UpdatePartnerRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        if (result == null) return NotFound(new { message = "Partner not found." });
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound(new { message = "Partner not found." });
        return Ok(new { message = "Partner deleted successfully." });
    }
}
