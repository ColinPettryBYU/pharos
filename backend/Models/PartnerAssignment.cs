namespace Pharos.Api.Models;

public class PartnerAssignment
{
    public int AssignmentId { get; set; }
    public int PartnerId { get; set; }
    public int? SafehouseId { get; set; }
    public string ProgramArea { get; set; } = string.Empty;
    public DateTime AssignmentStart { get; set; }
    public DateTime? AssignmentEnd { get; set; }
    public string? ResponsibilityNotes { get; set; }
    public bool IsPrimary { get; set; }
    public string Status { get; set; } = string.Empty;

    // Navigation properties
    public Partner Partner { get; set; } = null!;
    public Safehouse? Safehouse { get; set; }
}
