namespace Pharos.Api.Models;

public class Partner
{
    public int PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public string PartnerType { get; set; } = string.Empty;
    public string RoleType { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Region { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public ICollection<PartnerAssignment> PartnerAssignments { get; set; } = new List<PartnerAssignment>();
}
