using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(IReportService service) => _service = service;

    [HttpGet("donations")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<DonationReportDto>> GetDonationReport(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var result = await _service.GetDonationReportAsync(from, to);
        return Ok(result);
    }

    [HttpGet("outcomes")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<OutcomesReportDto>> GetOutcomesReport()
    {
        var result = await _service.GetOutcomesReportAsync();
        return Ok(result);
    }

    [HttpGet("safehouses")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<SafehouseReportResponseDto>> GetSafehouseReport()
    {
        var result = await _service.GetSafehouseReportAsync();
        return Ok(result);
    }

    [HttpGet("social-media")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<SocialMediaReportDto>> GetSocialMediaReport(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var result = await _service.GetSocialMediaReportAsync(from, to);
        return Ok(result);
    }
}
