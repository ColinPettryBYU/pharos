namespace Pharos.Api.Models;

public class InterventionPlan
{
    public int PlanId { get; set; }
    public int ResidentId { get; set; }
    public string PlanCategory { get; set; } = string.Empty;
    public string? PlanDescription { get; set; }
    public string? ServicesProvided { get; set; }
    public decimal? TargetValue { get; set; }
    public DateTime? TargetDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? CaseConferenceDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Resident Resident { get; set; } = null!;
}
