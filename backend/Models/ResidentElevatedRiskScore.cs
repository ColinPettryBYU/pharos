namespace Pharos.Api.Models;

public class ResidentElevatedRiskScore
{
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public double RiskScore { get; set; }
    public string RiskTier { get; set; } = string.Empty;
    public string? TopFactors { get; set; }
    public DateTime ComputedAt { get; set; }
}
