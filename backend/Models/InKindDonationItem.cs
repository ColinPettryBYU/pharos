namespace Pharos.Api.Models;

public class InKindDonationItem
{
    public int ItemId { get; set; }
    public int DonationId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCategory { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? UnitOfMeasure { get; set; }
    public decimal? EstimatedUnitValue { get; set; }
    public string? IntendedUse { get; set; }
    public string? ReceivedCondition { get; set; }

    // Navigation properties
    public Donation Donation { get; set; } = null!;
}
