namespace Pharos.Api.DTOs;

// ── Process Recording ──
public record ProcessRecordingDto(
    int RecordingId,
    int ResidentId,
    string? ResidentCode,
    DateTime SessionDate,
    string SocialWorker,
    string SessionType,
    int SessionDurationMinutes,
    string? EmotionalStateObserved,
    string? EmotionalStateEnd,
    string? SessionNarrative,
    string? InterventionsApplied,
    string? FollowUpActions,
    string? ProgressNoted,
    string? ConcernsFlagged,
    bool ReferralMade,
    string? NotesRestricted
);

public record CreateProcessRecordingRequest(
    int ResidentId,
    DateTime SessionDate,
    string SocialWorker,
    string SessionType,
    int SessionDurationMinutes,
    string? EmotionalStateObserved,
    string? EmotionalStateEnd,
    string? SessionNarrative,
    string? InterventionsApplied,
    string? FollowUpActions,
    string? ProgressNoted,
    string? ConcernsFlagged,
    bool ReferralMade,
    string? NotesRestricted
);

public record UpdateProcessRecordingRequest(
    DateTime? SessionDate,
    string? SocialWorker,
    string? SessionType,
    int? SessionDurationMinutes,
    string? EmotionalStateObserved,
    string? EmotionalStateEnd,
    string? SessionNarrative,
    string? InterventionsApplied,
    string? FollowUpActions,
    string? ProgressNoted,
    string? ConcernsFlagged,
    bool? ReferralMade,
    string? NotesRestricted
);

// ── Home Visitation ──
public record HomeVisitationDto(
    int VisitationId,
    int ResidentId,
    string? ResidentCode,
    DateTime VisitDate,
    string SocialWorker,
    string VisitType,
    string? LocationVisited,
    string? FamilyMembersPresent,
    string? Purpose,
    string? Observations,
    string? FamilyCooperationLevel,
    string? SafetyConcernsNoted,
    bool FollowUpNeeded,
    string? FollowUpNotes,
    string? VisitOutcome
);

public record CreateHomeVisitationRequest(
    int ResidentId,
    DateTime VisitDate,
    string SocialWorker,
    string VisitType,
    string? LocationVisited,
    string? FamilyMembersPresent,
    string? Purpose,
    string? Observations,
    string? FamilyCooperationLevel,
    string? SafetyConcernsNoted,
    bool FollowUpNeeded,
    string? FollowUpNotes,
    string? VisitOutcome
);

public record UpdateHomeVisitationRequest(
    DateTime? VisitDate,
    string? SocialWorker,
    string? VisitType,
    string? LocationVisited,
    string? FamilyMembersPresent,
    string? Purpose,
    string? Observations,
    string? FamilyCooperationLevel,
    string? SafetyConcernsNoted,
    bool? FollowUpNeeded,
    string? FollowUpNotes,
    string? VisitOutcome
);

// ── Education Record ──
public record EducationRecordDto(
    int EducationRecordId,
    int ResidentId,
    string? ResidentCode,
    DateTime RecordDate,
    string EducationLevel,
    string? SchoolName,
    string? EnrollmentStatus,
    decimal? AttendanceRate,
    decimal? ProgressPercent,
    string? CompletionStatus,
    string? Notes
);

public record CreateEducationRecordRequest(
    int ResidentId,
    DateTime RecordDate,
    string EducationLevel,
    string? SchoolName,
    string? EnrollmentStatus,
    decimal? AttendanceRate,
    decimal? ProgressPercent,
    string? CompletionStatus,
    string? Notes
);

public record UpdateEducationRecordRequest(
    DateTime? RecordDate,
    string? EducationLevel,
    string? SchoolName,
    string? EnrollmentStatus,
    decimal? AttendanceRate,
    decimal? ProgressPercent,
    string? CompletionStatus,
    string? Notes
);

// ── Health Wellbeing Record ──
public record HealthRecordDto(
    int HealthRecordId,
    int ResidentId,
    string? ResidentCode,
    DateTime RecordDate,
    decimal GeneralHealthScore,
    decimal NutritionScore,
    decimal SleepQualityScore,
    decimal EnergyLevelScore,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? Bmi,
    bool MedicalCheckupDone,
    bool DentalCheckupDone,
    bool PsychologicalCheckupDone,
    string? Notes
);

public record CreateHealthRecordRequest(
    int ResidentId,
    DateTime RecordDate,
    decimal GeneralHealthScore,
    decimal NutritionScore,
    decimal SleepQualityScore,
    decimal EnergyLevelScore,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? Bmi,
    bool MedicalCheckupDone,
    bool DentalCheckupDone,
    bool PsychologicalCheckupDone,
    string? Notes
);

public record UpdateHealthRecordRequest(
    DateTime? RecordDate,
    decimal? GeneralHealthScore,
    decimal? NutritionScore,
    decimal? SleepQualityScore,
    decimal? EnergyLevelScore,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? Bmi,
    bool? MedicalCheckupDone,
    bool? DentalCheckupDone,
    bool? PsychologicalCheckupDone,
    string? Notes
);

// ── Intervention Plan ──
public record InterventionPlanDto(
    int PlanId,
    int ResidentId,
    string? ResidentCode,
    string PlanCategory,
    string? PlanDescription,
    string? ServicesProvided,
    decimal? TargetValue,
    DateTime? TargetDate,
    string Status,
    DateTime? CaseConferenceDate,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateInterventionPlanRequest(
    int ResidentId,
    string PlanCategory,
    string? PlanDescription,
    string? ServicesProvided,
    decimal? TargetValue,
    DateTime? TargetDate,
    string Status,
    DateTime? CaseConferenceDate
);

public record UpdateInterventionPlanRequest(
    string? PlanCategory,
    string? PlanDescription,
    string? ServicesProvided,
    decimal? TargetValue,
    DateTime? TargetDate,
    string? Status,
    DateTime? CaseConferenceDate
);

// ── Incident Report ──
public record IncidentReportDto(
    int IncidentId,
    int ResidentId,
    string? ResidentCode,
    int SafehouseId,
    string? SafehouseName,
    DateTime IncidentDate,
    string IncidentType,
    string Severity,
    string? Description,
    string? ResponseTaken,
    bool Resolved,
    DateTime? ResolutionDate,
    string? ReportedBy,
    bool FollowUpRequired
);

public record CreateIncidentReportRequest(
    int ResidentId,
    int SafehouseId,
    DateTime IncidentDate,
    string IncidentType,
    string Severity,
    string? Description,
    string? ResponseTaken,
    bool Resolved,
    DateTime? ResolutionDate,
    string? ReportedBy,
    bool FollowUpRequired
);

public record UpdateIncidentReportRequest(
    DateTime? IncidentDate,
    string? IncidentType,
    string? Severity,
    string? Description,
    string? ResponseTaken,
    bool? Resolved,
    DateTime? ResolutionDate,
    string? ReportedBy,
    bool? FollowUpRequired
);
