namespace Pharos.Api.Models;

public class DonorChurnScore
{
    public int Id { get; set; }
    public int SupporterId { get; set; }
    public double ChurnRiskScore { get; set; }
    public string RiskTier { get; set; } = string.Empty;
    public DateTime ComputedAt { get; set; }
}
