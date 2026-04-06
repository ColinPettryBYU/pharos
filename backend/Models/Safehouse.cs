namespace Pharos.Api.Models;

public class Safehouse
{
    public int SafehouseId { get; set; }
    public string SafehouseCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public DateTime OpenDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CapacityGirls { get; set; }
    public int CapacityStaff { get; set; }
    public int CurrentOccupancy { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public ICollection<Resident> Residents { get; set; } = new List<Resident>();
    public ICollection<PartnerAssignment> PartnerAssignments { get; set; } = new List<PartnerAssignment>();
    public ICollection<DonationAllocation> DonationAllocations { get; set; } = new List<DonationAllocation>();
    public ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();
    public ICollection<SafehouseMonthlyMetric> MonthlyMetrics { get; set; } = new List<SafehouseMonthlyMetric>();
}
