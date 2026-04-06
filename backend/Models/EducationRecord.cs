namespace Pharos.Api.Models;

public class EducationRecord
{
    public int EducationRecordId { get; set; }
    public int ResidentId { get; set; }
    public DateTime RecordDate { get; set; }
    public string EducationLevel { get; set; } = string.Empty;
    public string? SchoolName { get; set; }
    public string? EnrollmentStatus { get; set; }
    public decimal? AttendanceRate { get; set; }
    public decimal? ProgressPercent { get; set; }
    public string? CompletionStatus { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public Resident Resident { get; set; } = null!;
}
