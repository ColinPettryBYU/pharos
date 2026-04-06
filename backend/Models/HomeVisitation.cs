namespace Pharos.Api.Models;

public class HomeVisitation
{
    public int VisitationId { get; set; }
    public int ResidentId { get; set; }
    public DateTime VisitDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string VisitType { get; set; } = string.Empty;
    public string? LocationVisited { get; set; }
    public string? FamilyMembersPresent { get; set; }
    public string? Purpose { get; set; }
    public string? Observations { get; set; }
    public string? FamilyCooperationLevel { get; set; }
    public string? SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }
    public string? FollowUpNotes { get; set; }
    public string? VisitOutcome { get; set; }

    // Navigation properties
    public Resident Resident { get; set; } = null!;
}
