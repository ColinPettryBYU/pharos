namespace Pharos.Api.Models;

public class Donation
{
    public int DonationId { get; set; }
    public int SupporterId { get; set; }
    public string DonationType { get; set; } = string.Empty;
    public DateTime DonationDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string ChannelSource { get; set; } = string.Empty;
    public string? CurrencyCode { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public string? Notes { get; set; }
    public int? ReferralPostId { get; set; }

    // Navigation properties
    public Supporter Supporter { get; set; } = null!;
    public SocialMediaPost? ReferralPost { get; set; }
    public ICollection<InKindDonationItem> InKindItems { get; set; } = new List<InKindDonationItem>();
    public ICollection<DonationAllocation> Allocations { get; set; } = new List<DonationAllocation>();
}
