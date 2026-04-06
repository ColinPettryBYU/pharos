namespace Pharos.Api.Models;

public class DonationAllocation
{
    public int AllocationId { get; set; }
    public int DonationId { get; set; }
    public int SafehouseId { get; set; }
    public string ProgramArea { get; set; } = string.Empty;
    public decimal AmountAllocated { get; set; }
    public DateTime AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }

    // Navigation properties
    public Donation Donation { get; set; } = null!;
    public Safehouse Safehouse { get; set; } = null!;
}
