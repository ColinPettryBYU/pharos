using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ISafehouseService _safehouseService;

    public PublicController(IReportService reportService, ISafehouseService safehouseService)
    {
        _reportService = reportService;
        _safehouseService = safehouseService;
    }

    [HttpGet("impact-snapshots")]
    public async Task<ActionResult<PagedResult<PublicImpactSnapshotDto>>> GetImpactSnapshots(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 500)
    {
        var result = await _reportService.GetImpactSnapshotsAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("impact-snapshots/{id}")]
    public async Task<ActionResult<PublicImpactSnapshotDto>> GetImpactSnapshotById(int id)
    {
        var result = await _reportService.GetImpactSnapshotByIdAsync(id);
        if (result == null) return NotFound(new { message = "Snapshot not found." });
        return Ok(result);
    }

    [HttpGet("safehouses/summary")]
    public async Task<ActionResult<PublicAggregateSummaryDto>> GetSafehouseSummary()
    {
        var result = await _safehouseService.GetPublicSummaryAsync();
        return Ok(result);
    }
}
