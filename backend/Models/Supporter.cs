namespace Pharos.Api.Models;

public class Supporter
{
    public int SupporterId { get; set; }
    public string SupporterType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string? Region { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? FirstDonationDate { get; set; }
    public string? AcquisitionChannel { get; set; }

    // Navigation properties
    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
}
