namespace Pharos.Api.Models;

public class ProcessRecording
{
    public int RecordingId { get; set; }
    public int ResidentId { get; set; }
    public DateTime SessionDate { get; set; }
    public string SocialWorker { get; set; } = string.Empty;
    public string SessionType { get; set; } = string.Empty;
    public int SessionDurationMinutes { get; set; }
    public string? EmotionalStateObserved { get; set; }
    public string? EmotionalStateEnd { get; set; }
    public string? SessionNarrative { get; set; }
    public string? InterventionsApplied { get; set; }
    public string? FollowUpActions { get; set; }
    public string? ProgressNoted { get; set; }
    public string? ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }
    public string? NotesRestricted { get; set; }

    // Navigation properties
    public Resident Resident { get; set; } = null!;
}
