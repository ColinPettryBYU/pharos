using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/ml")]
[Authorize(Roles = "Admin")]
public class MLController : ControllerBase
{
    private readonly IMLService _mlService;
    private readonly PharosDbContext _db;

    public MLController(IMLService mlService, PharosDbContext db)
    {
        _mlService = mlService;
        _db = db;
    }

    /// <summary>
    /// Returns churn risk scores for all donors with donation history.
    /// Currently uses heuristic-based scoring; will be replaced with ML model inference.
    /// </summary>
    [HttpGet("donor-churn-risk")]
    public async Task<ActionResult<IEnumerable<DonorChurnRiskDto>>> GetDonorChurnRisks()
    {
        var result = await _mlService.GetDonorChurnRisksAsync();
        return Ok(result);
    }

    /// <summary>
    /// Returns reintegration readiness score and contributing factors for a specific resident.
    /// Currently uses weighted heuristic scoring; will be replaced with ML model inference.
    /// </summary>
    [HttpGet("reintegration-readiness/{residentId}")]
    public async Task<ActionResult<ReintegrationReadinessDto>> GetReintegrationReadiness(int residentId)
    {
        var result = await _mlService.GetReintegrationReadinessAsync(residentId);
        if (result == null) return NotFound(new { message = "Resident not found." });
        return Ok(result);
    }

    /// <summary>
    /// Returns recommendations for optimal social media posting strategy.
    /// Currently based on historical data analysis; will incorporate ML predictions.
    /// </summary>
    [HttpGet("social-media-recommendations")]
    public async Task<ActionResult<SocialMediaRecommendationDto>> GetSocialMediaRecommendations()
    {
        var result = await _mlService.GetSocialMediaRecommendationsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Returns analysis of which intervention types are most effective.
    /// </summary>
    [HttpGet("intervention-effectiveness")]
    public async Task<ActionResult<InterventionEffectivenessDto>> GetInterventionEffectiveness()
    {
        var result = await _mlService.GetInterventionEffectivenessAsync();
        return Ok(result);
    }

    /// <summary>
    /// Returns reintegration readiness scores for all residents at once.
    /// Used by the admin dashboard to show top at-risk residents.
    /// </summary>
    [HttpGet("reintegration-readiness/all")]
    public async Task<ActionResult<IEnumerable<ReintegrationReadinessDto>>> GetAllReintegrationReadiness()
    {
        var scores = await _db.ResidentReadinessScores
            .Join(_db.Residents,
                  s => s.ResidentId,
                  r => r.ResidentId,
                  (s, r) => new ReintegrationReadinessDto(
                      r.ResidentId, r.InternalCode,
                      s.ReadinessScore / 100.0, s.ReadinessTier,
                      new List<ReadinessFactorDto>(),
                      new List<string>()))
            .ToListAsync();
        return Ok(scores);
    }
}
