namespace Pharos.Api.Models;

public class IncidentReport
{
    public int IncidentId { get; set; }
    public int ResidentId { get; set; }
    public int SafehouseId { get; set; }
    public DateTime IncidentDate { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ResponseTaken { get; set; }
    public bool Resolved { get; set; }
    public DateTime? ResolutionDate { get; set; }
    public string? ReportedBy { get; set; }
    public bool FollowUpRequired { get; set; }

    // Navigation properties
    public Resident Resident { get; set; } = null!;
    public Safehouse Safehouse { get; set; } = null!;
}
