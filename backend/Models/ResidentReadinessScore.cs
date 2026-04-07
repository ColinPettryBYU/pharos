namespace Pharos.Api.Models;

public class ResidentReadinessScore
{
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public double ReadinessScore { get; set; }
    public string ReadinessTier { get; set; } = string.Empty;
    public DateTime ComputedAt { get; set; }
}
