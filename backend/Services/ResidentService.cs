using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services;

public class ResidentService : IResidentService
{
    private readonly PharosDbContext _db;

    public ResidentService(PharosDbContext db) => _db = db;

    // ── Residents ──

    public async Task<PagedResult<ResidentDto>> GetAllAsync(int page, int pageSize, string? caseStatus, string? riskLevel, int? safehouseId, string? search)
    {
        var query = _db.Residents.Include(r => r.Safehouse).AsQueryable();

        if (!string.IsNullOrWhiteSpace(caseStatus)) query = query.Where(r => r.CaseStatus == caseStatus);
        if (!string.IsNullOrWhiteSpace(riskLevel)) query = query.Where(r => r.CurrentRiskLevel == riskLevel);
        if (safehouseId.HasValue) query = query.Where(r => r.SafehouseId == safehouseId.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(r => r.InternalCode.Contains(search) || r.CaseControlNo.Contains(search) || (r.AssignedSocialWorker != null && r.AssignedSocialWorker.Contains(search)));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(r => r.DateOfAdmission)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ResidentDto(
                r.ResidentId, r.CaseControlNo, r.InternalCode, r.SafehouseId, r.Safehouse.Name,
                r.CaseStatus, r.Sex, r.DateOfBirth, r.CaseCategory, r.ReintegrationType,
                r.ReintegrationStatus, r.InitialRiskLevel, r.CurrentRiskLevel,
                r.AssignedSocialWorker, r.DateOfAdmission, r.PresentAge, r.LengthOfStay, r.DateClosed))
            .ToListAsync();

        return new PagedResult<ResidentDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<ResidentDetailDto?> GetByIdAsync(int id)
    {
        var r = await _db.Residents.Include(x => x.Safehouse).FirstOrDefaultAsync(x => x.ResidentId == id);
        if (r == null) return null;

        return new ResidentDetailDto(
            r.ResidentId, r.CaseControlNo, r.InternalCode, r.SafehouseId, r.Safehouse.Name,
            r.CaseStatus, r.Sex, r.DateOfBirth, r.BirthStatus, r.PlaceOfBirth, r.Religion,
            r.CaseCategory, r.SubCatOrphaned, r.SubCatTrafficked, r.SubCatChildLabor,
            r.SubCatPhysicalAbuse, r.SubCatSexualAbuse, r.SubCatOsaec, r.SubCatCicl,
            r.SubCatAtRisk, r.SubCatStreetChild, r.SubCatChildWithHiv, r.IsPwd, r.PwdType,
            r.HasSpecialNeeds, r.SpecialNeedsDiagnosis, r.FamilyIs4ps, r.FamilySoloParent,
            r.FamilyIndigenous, r.FamilyParentPwd, r.FamilyInformalSettler, r.DateOfAdmission,
            r.AgeUponAdmission, r.PresentAge, r.LengthOfStay, r.ReferralSource,
            r.ReferringAgencyPerson, r.DateColbRegistered, r.DateColbObtained,
            r.AssignedSocialWorker, r.InitialCaseAssessment, r.DateCaseStudyPrepared,
            r.ReintegrationType, r.ReintegrationStatus, r.InitialRiskLevel, r.CurrentRiskLevel,
            r.DateEnrolled, r.DateClosed, r.CreatedAt, r.NotesRestricted);
    }

    public async Task<ResidentSummaryDto?> GetSummaryAsync(int id)
    {
        var r = await _db.Residents
            .Include(x => x.ProcessRecordings)
            .Include(x => x.HomeVisitations)
            .Include(x => x.EducationRecords)
            .Include(x => x.HealthRecords)
            .Include(x => x.InterventionPlans)
            .Include(x => x.IncidentReports)
            .FirstOrDefaultAsync(x => x.ResidentId == id);

        if (r == null) return null;

        var latestHealth = r.HealthRecords.OrderByDescending(h => h.RecordDate).FirstOrDefault();
        var latestEducation = r.EducationRecords.OrderByDescending(e => e.RecordDate).FirstOrDefault();
        var latestSession = r.ProcessRecordings.OrderByDescending(p => p.SessionDate).FirstOrDefault();
        var latestVisit = r.HomeVisitations.OrderByDescending(v => v.VisitDate).FirstOrDefault();

        return new ResidentSummaryDto(
            r.ResidentId, r.CaseControlNo, r.InternalCode, r.CaseStatus, r.CurrentRiskLevel,
            r.ReintegrationStatus,
            latestHealth?.GeneralHealthScore,
            latestEducation?.ProgressPercent,
            r.ProcessRecordings.Count,
            r.HomeVisitations.Count,
            r.InterventionPlans.Count(p => p.Status == "Open" || p.Status == "In Progress"),
            r.IncidentReports.Count,
            latestSession?.EmotionalStateEnd ?? latestSession?.EmotionalStateObserved,
            latestSession?.SessionDate,
            latestVisit?.VisitDate);
    }

    public async Task<ResidentDto> CreateAsync(CreateResidentRequest req)
    {
        var entity = new Resident
        {
            CaseControlNo = req.CaseControlNo,
            InternalCode = req.InternalCode,
            SafehouseId = req.SafehouseId,
            CaseStatus = req.CaseStatus,
            Sex = req.Sex,
            DateOfBirth = req.DateOfBirth,
            BirthStatus = req.BirthStatus,
            PlaceOfBirth = req.PlaceOfBirth,
            Religion = req.Religion,
            CaseCategory = req.CaseCategory,
            SubCatOrphaned = req.SubCatOrphaned,
            SubCatTrafficked = req.SubCatTrafficked,
            SubCatChildLabor = req.SubCatChildLabor,
            SubCatPhysicalAbuse = req.SubCatPhysicalAbuse,
            SubCatSexualAbuse = req.SubCatSexualAbuse,
            SubCatOsaec = req.SubCatOsaec,
            SubCatCicl = req.SubCatCicl,
            SubCatAtRisk = req.SubCatAtRisk,
            SubCatStreetChild = req.SubCatStreetChild,
            SubCatChildWithHiv = req.SubCatChildWithHiv,
            IsPwd = req.IsPwd,
            PwdType = req.PwdType,
            HasSpecialNeeds = req.HasSpecialNeeds,
            SpecialNeedsDiagnosis = req.SpecialNeedsDiagnosis,
            FamilyIs4ps = req.FamilyIs4ps,
            FamilySoloParent = req.FamilySoloParent,
            FamilyIndigenous = req.FamilyIndigenous,
            FamilyParentPwd = req.FamilyParentPwd,
            FamilyInformalSettler = req.FamilyInformalSettler,
            DateOfAdmission = req.DateOfAdmission,
            ReferralSource = req.ReferralSource,
            ReferringAgencyPerson = req.ReferringAgencyPerson,
            AssignedSocialWorker = req.AssignedSocialWorker,
            InitialCaseAssessment = req.InitialCaseAssessment,
            ReintegrationType = req.ReintegrationType,
            ReintegrationStatus = "Not Started",
            InitialRiskLevel = req.InitialRiskLevel,
            CurrentRiskLevel = req.CurrentRiskLevel ?? req.InitialRiskLevel,
            DateEnrolled = req.DateEnrolled,
            CreatedAt = DateTime.UtcNow,
            NotesRestricted = req.NotesRestricted
        };

        _db.Residents.Add(entity);
        await _db.SaveChangesAsync();

        var safehouse = await _db.Safehouses.FindAsync(entity.SafehouseId);

        return new ResidentDto(
            entity.ResidentId, entity.CaseControlNo, entity.InternalCode,
            entity.SafehouseId, safehouse?.Name, entity.CaseStatus, entity.Sex,
            entity.DateOfBirth, entity.CaseCategory, entity.ReintegrationType,
            entity.ReintegrationStatus, entity.InitialRiskLevel, entity.CurrentRiskLevel,
            entity.AssignedSocialWorker, entity.DateOfAdmission, entity.PresentAge,
            entity.LengthOfStay, entity.DateClosed);
    }

    public async Task<ResidentDto?> UpdateAsync(int id, UpdateResidentRequest req)
    {
        var entity = await _db.Residents.Include(r => r.Safehouse).FirstOrDefaultAsync(r => r.ResidentId == id);
        if (entity == null) return null;

        if (req.SafehouseId.HasValue) entity.SafehouseId = req.SafehouseId.Value;
        if (req.CaseStatus != null) entity.CaseStatus = req.CaseStatus;
        if (req.AssignedSocialWorker != null) entity.AssignedSocialWorker = req.AssignedSocialWorker;
        if (req.ReintegrationType != null) entity.ReintegrationType = req.ReintegrationType;
        if (req.ReintegrationStatus != null) entity.ReintegrationStatus = req.ReintegrationStatus;
        if (req.CurrentRiskLevel != null) entity.CurrentRiskLevel = req.CurrentRiskLevel;
        if (req.DateClosed.HasValue) entity.DateClosed = req.DateClosed.Value;
        if (req.NotesRestricted != null) entity.NotesRestricted = req.NotesRestricted;

        await _db.SaveChangesAsync();

        return new ResidentDto(
            entity.ResidentId, entity.CaseControlNo, entity.InternalCode,
            entity.SafehouseId, entity.Safehouse.Name, entity.CaseStatus, entity.Sex,
            entity.DateOfBirth, entity.CaseCategory, entity.ReintegrationType,
            entity.ReintegrationStatus, entity.InitialRiskLevel, entity.CurrentRiskLevel,
            entity.AssignedSocialWorker, entity.DateOfAdmission, entity.PresentAge,
            entity.LengthOfStay, entity.DateClosed);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _db.Residents.FindAsync(id);
        if (entity == null) return false;
        _db.Residents.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Process Recordings ──

    public async Task<PagedResult<ProcessRecordingDto>> GetProcessRecordingsAsync(int page, int pageSize, int? residentId, string? sessionType, string? search)
    {
        var query = _db.ProcessRecordings.Include(p => p.Resident).AsQueryable();
        if (residentId.HasValue) query = query.Where(p => p.ResidentId == residentId.Value);
        if (!string.IsNullOrWhiteSpace(sessionType)) query = query.Where(p => p.SessionType == sessionType);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.SocialWorker.Contains(search) || (p.SessionNarrative != null && p.SessionNarrative.Contains(search)));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query.OrderByDescending(p => p.SessionDate).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new ProcessRecordingDto(p.RecordingId, p.ResidentId, p.Resident.InternalCode, p.SessionDate, p.SocialWorker, p.SessionType, p.SessionDurationMinutes, p.EmotionalStateObserved, p.EmotionalStateEnd, p.SessionNarrative, p.InterventionsApplied, p.FollowUpActions, p.ProgressNoted, p.ConcernsFlagged, p.ReferralMade, p.NotesRestricted))
            .ToListAsync();

        return new PagedResult<ProcessRecordingDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<ProcessRecordingDto?> GetProcessRecordingByIdAsync(int id)
    {
        var p = await _db.ProcessRecordings.Include(x => x.Resident).FirstOrDefaultAsync(x => x.RecordingId == id);
        if (p == null) return null;
        return new ProcessRecordingDto(p.RecordingId, p.ResidentId, p.Resident.InternalCode, p.SessionDate, p.SocialWorker, p.SessionType, p.SessionDurationMinutes, p.EmotionalStateObserved, p.EmotionalStateEnd, p.SessionNarrative, p.InterventionsApplied, p.FollowUpActions, p.ProgressNoted, p.ConcernsFlagged, p.ReferralMade, p.NotesRestricted);
    }

    public async Task<ProcessRecordingDto> CreateProcessRecordingAsync(CreateProcessRecordingRequest req)
    {
        var entity = new ProcessRecording
        {
            ResidentId = req.ResidentId, SessionDate = req.SessionDate, SocialWorker = req.SocialWorker,
            SessionType = req.SessionType, SessionDurationMinutes = req.SessionDurationMinutes,
            EmotionalStateObserved = req.EmotionalStateObserved, EmotionalStateEnd = req.EmotionalStateEnd,
            SessionNarrative = req.SessionNarrative, InterventionsApplied = req.InterventionsApplied,
            FollowUpActions = req.FollowUpActions, ProgressNoted = req.ProgressNoted,
            ConcernsFlagged = req.ConcernsFlagged, ReferralMade = req.ReferralMade, NotesRestricted = req.NotesRestricted
        };
        _db.ProcessRecordings.Add(entity);
        await _db.SaveChangesAsync();
        var resident = await _db.Residents.FindAsync(entity.ResidentId);
        return new ProcessRecordingDto(entity.RecordingId, entity.ResidentId, resident?.InternalCode, entity.SessionDate, entity.SocialWorker, entity.SessionType, entity.SessionDurationMinutes, entity.EmotionalStateObserved, entity.EmotionalStateEnd, entity.SessionNarrative, entity.InterventionsApplied, entity.FollowUpActions, entity.ProgressNoted, entity.ConcernsFlagged, entity.ReferralMade, entity.NotesRestricted);
    }

    public async Task<ProcessRecordingDto?> UpdateProcessRecordingAsync(int id, UpdateProcessRecordingRequest req)
    {
        var entity = await _db.ProcessRecordings.Include(p => p.Resident).FirstOrDefaultAsync(p => p.RecordingId == id);
        if (entity == null) return null;

        if (req.SessionDate.HasValue) entity.SessionDate = req.SessionDate.Value;
        if (req.SocialWorker != null) entity.SocialWorker = req.SocialWorker;
        if (req.SessionType != null) entity.SessionType = req.SessionType;
        if (req.SessionDurationMinutes.HasValue) entity.SessionDurationMinutes = req.SessionDurationMinutes.Value;
        if (req.EmotionalStateObserved != null) entity.EmotionalStateObserved = req.EmotionalStateObserved;
        if (req.EmotionalStateEnd != null) entity.EmotionalStateEnd = req.EmotionalStateEnd;
        if (req.SessionNarrative != null) entity.SessionNarrative = req.SessionNarrative;
        if (req.InterventionsApplied != null) entity.InterventionsApplied = req.InterventionsApplied;
        if (req.FollowUpActions != null) entity.FollowUpActions = req.FollowUpActions;
        if (req.ProgressNoted != null) entity.ProgressNoted = req.ProgressNoted;
        if (req.ConcernsFlagged != null) entity.ConcernsFlagged = req.ConcernsFlagged;
        if (req.ReferralMade.HasValue) entity.ReferralMade = req.ReferralMade.Value;
        if (req.NotesRestricted != null) entity.NotesRestricted = req.NotesRestricted;

        await _db.SaveChangesAsync();
        return new ProcessRecordingDto(entity.RecordingId, entity.ResidentId, entity.Resident.InternalCode, entity.SessionDate, entity.SocialWorker, entity.SessionType, entity.SessionDurationMinutes, entity.EmotionalStateObserved, entity.EmotionalStateEnd, entity.SessionNarrative, entity.InterventionsApplied, entity.FollowUpActions, entity.ProgressNoted, entity.ConcernsFlagged, entity.ReferralMade, entity.NotesRestricted);
    }

    // ── Home Visitations ──

    public async Task<PagedResult<HomeVisitationDto>> GetHomeVisitationsAsync(int page, int pageSize, int? residentId, string? visitType, string? search)
    {
        var query = _db.HomeVisitations.Include(v => v.Resident).AsQueryable();
        if (residentId.HasValue) query = query.Where(v => v.ResidentId == residentId.Value);
        if (!string.IsNullOrWhiteSpace(visitType)) query = query.Where(v => v.VisitType == visitType);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(v => v.SocialWorker.Contains(search));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var items = await query.OrderByDescending(v => v.VisitDate).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(v => new HomeVisitationDto(v.VisitationId, v.ResidentId, v.Resident.InternalCode, v.VisitDate, v.SocialWorker, v.VisitType, v.LocationVisited, v.FamilyMembersPresent, v.Purpose, v.Observations, v.FamilyCooperationLevel, v.SafetyConcernsNoted, v.FollowUpNeeded, v.FollowUpNotes, v.VisitOutcome))
            .ToListAsync();
        return new PagedResult<HomeVisitationDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<HomeVisitationDto> CreateHomeVisitationAsync(CreateHomeVisitationRequest req)
    {
        var entity = new HomeVisitation { ResidentId = req.ResidentId, VisitDate = req.VisitDate, SocialWorker = req.SocialWorker, VisitType = req.VisitType, LocationVisited = req.LocationVisited, FamilyMembersPresent = req.FamilyMembersPresent, Purpose = req.Purpose, Observations = req.Observations, FamilyCooperationLevel = req.FamilyCooperationLevel, SafetyConcernsNoted = req.SafetyConcernsNoted, FollowUpNeeded = req.FollowUpNeeded, FollowUpNotes = req.FollowUpNotes, VisitOutcome = req.VisitOutcome };
        _db.HomeVisitations.Add(entity);
        await _db.SaveChangesAsync();
        var resident = await _db.Residents.FindAsync(entity.ResidentId);
        return new HomeVisitationDto(entity.VisitationId, entity.ResidentId, resident?.InternalCode, entity.VisitDate, entity.SocialWorker, entity.VisitType, entity.LocationVisited, entity.FamilyMembersPresent, entity.Purpose, entity.Observations, entity.FamilyCooperationLevel, entity.SafetyConcernsNoted, entity.FollowUpNeeded, entity.FollowUpNotes, entity.VisitOutcome);
    }

    public async Task<HomeVisitationDto?> UpdateHomeVisitationAsync(int id, UpdateHomeVisitationRequest req)
    {
        var entity = await _db.HomeVisitations.Include(v => v.Resident).FirstOrDefaultAsync(v => v.VisitationId == id);
        if (entity == null) return null;
        if (req.VisitDate.HasValue) entity.VisitDate = req.VisitDate.Value;
        if (req.SocialWorker != null) entity.SocialWorker = req.SocialWorker;
        if (req.VisitType != null) entity.VisitType = req.VisitType;
        if (req.LocationVisited != null) entity.LocationVisited = req.LocationVisited;
        if (req.FamilyMembersPresent != null) entity.FamilyMembersPresent = req.FamilyMembersPresent;
        if (req.Purpose != null) entity.Purpose = req.Purpose;
        if (req.Observations != null) entity.Observations = req.Observations;
        if (req.FamilyCooperationLevel != null) entity.FamilyCooperationLevel = req.FamilyCooperationLevel;
        if (req.SafetyConcernsNoted != null) entity.SafetyConcernsNoted = req.SafetyConcernsNoted;
        if (req.FollowUpNeeded.HasValue) entity.FollowUpNeeded = req.FollowUpNeeded.Value;
        if (req.FollowUpNotes != null) entity.FollowUpNotes = req.FollowUpNotes;
        if (req.VisitOutcome != null) entity.VisitOutcome = req.VisitOutcome;
        await _db.SaveChangesAsync();
        return new HomeVisitationDto(entity.VisitationId, entity.ResidentId, entity.Resident.InternalCode, entity.VisitDate, entity.SocialWorker, entity.VisitType, entity.LocationVisited, entity.FamilyMembersPresent, entity.Purpose, entity.Observations, entity.FamilyCooperationLevel, entity.SafetyConcernsNoted, entity.FollowUpNeeded, entity.FollowUpNotes, entity.VisitOutcome);
    }

    // ── Education Records ──

    public async Task<PagedResult<EducationRecordDto>> GetEducationRecordsAsync(int page, int pageSize, int? residentId)
    {
        var query = _db.EducationRecords.Include(e => e.Resident).AsQueryable();
        if (residentId.HasValue) query = query.Where(e => e.ResidentId == residentId.Value);
        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var items = await query.OrderByDescending(e => e.RecordDate).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(e => new EducationRecordDto(e.EducationRecordId, e.ResidentId, e.Resident.InternalCode, e.RecordDate, e.EducationLevel, e.SchoolName, e.EnrollmentStatus, e.AttendanceRate, e.ProgressPercent, e.CompletionStatus, e.Notes))
            .ToListAsync();
        return new PagedResult<EducationRecordDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<EducationRecordDto> CreateEducationRecordAsync(CreateEducationRecordRequest req)
    {
        var entity = new EducationRecord { ResidentId = req.ResidentId, RecordDate = req.RecordDate, EducationLevel = req.EducationLevel, SchoolName = req.SchoolName, EnrollmentStatus = req.EnrollmentStatus, AttendanceRate = req.AttendanceRate, ProgressPercent = req.ProgressPercent, CompletionStatus = req.CompletionStatus, Notes = req.Notes };
        _db.EducationRecords.Add(entity);
        await _db.SaveChangesAsync();
        var resident = await _db.Residents.FindAsync(entity.ResidentId);
        return new EducationRecordDto(entity.EducationRecordId, entity.ResidentId, resident?.InternalCode, entity.RecordDate, entity.EducationLevel, entity.SchoolName, entity.EnrollmentStatus, entity.AttendanceRate, entity.ProgressPercent, entity.CompletionStatus, entity.Notes);
    }

    public async Task<EducationRecordDto?> UpdateEducationRecordAsync(int id, UpdateEducationRecordRequest req)
    {
        var entity = await _db.EducationRecords.Include(e => e.Resident).FirstOrDefaultAsync(e => e.EducationRecordId == id);
        if (entity == null) return null;
        if (req.RecordDate.HasValue) entity.RecordDate = req.RecordDate.Value;
        if (req.EducationLevel != null) entity.EducationLevel = req.EducationLevel;
        if (req.SchoolName != null) entity.SchoolName = req.SchoolName;
        if (req.EnrollmentStatus != null) entity.EnrollmentStatus = req.EnrollmentStatus;
        if (req.AttendanceRate.HasValue) entity.AttendanceRate = req.AttendanceRate.Value;
        if (req.ProgressPercent.HasValue) entity.ProgressPercent = req.ProgressPercent.Value;
        if (req.CompletionStatus != null) entity.CompletionStatus = req.CompletionStatus;
        if (req.Notes != null) entity.Notes = req.Notes;
        await _db.SaveChangesAsync();
        return new EducationRecordDto(entity.EducationRecordId, entity.ResidentId, entity.Resident.InternalCode, entity.RecordDate, entity.EducationLevel, entity.SchoolName, entity.EnrollmentStatus, entity.AttendanceRate, entity.ProgressPercent, entity.CompletionStatus, entity.Notes);
    }

    // ── Health Records ──

    public async Task<PagedResult<HealthRecordDto>> GetHealthRecordsAsync(int page, int pageSize, int? residentId)
    {
        var query = _db.HealthWellbeingRecords.Include(h => h.Resident).AsQueryable();
        if (residentId.HasValue) query = query.Where(h => h.ResidentId == residentId.Value);
        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var items = await query.OrderByDescending(h => h.RecordDate).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(h => new HealthRecordDto(h.HealthRecordId, h.ResidentId, h.Resident.InternalCode, h.RecordDate, h.GeneralHealthScore, h.NutritionScore, h.SleepQualityScore, h.EnergyLevelScore, h.HeightCm, h.WeightKg, h.Bmi, h.MedicalCheckupDone, h.DentalCheckupDone, h.PsychologicalCheckupDone, h.Notes))
            .ToListAsync();
        return new PagedResult<HealthRecordDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<HealthRecordDto> CreateHealthRecordAsync(CreateHealthRecordRequest req)
    {
        var entity = new HealthWellbeingRecord { ResidentId = req.ResidentId, RecordDate = req.RecordDate, GeneralHealthScore = req.GeneralHealthScore, NutritionScore = req.NutritionScore, SleepQualityScore = req.SleepQualityScore, EnergyLevelScore = req.EnergyLevelScore, HeightCm = req.HeightCm, WeightKg = req.WeightKg, Bmi = req.Bmi, MedicalCheckupDone = req.MedicalCheckupDone, DentalCheckupDone = req.DentalCheckupDone, PsychologicalCheckupDone = req.PsychologicalCheckupDone, Notes = req.Notes };
        _db.HealthWellbeingRecords.Add(entity);
        await _db.SaveChangesAsync();
        var resident = await _db.Residents.FindAsync(entity.ResidentId);
        return new HealthRecordDto(entity.HealthRecordId, entity.ResidentId, resident?.InternalCode, entity.RecordDate, entity.GeneralHealthScore, entity.NutritionScore, entity.SleepQualityScore, entity.EnergyLevelScore, entity.HeightCm, entity.WeightKg, entity.Bmi, entity.MedicalCheckupDone, entity.DentalCheckupDone, entity.PsychologicalCheckupDone, entity.Notes);
    }

    public async Task<HealthRecordDto?> UpdateHealthRecordAsync(int id, UpdateHealthRecordRequest req)
    {
        var entity = await _db.HealthWellbeingRecords.Include(h => h.Resident).FirstOrDefaultAsync(h => h.HealthRecordId == id);
        if (entity == null) return null;
        if (req.RecordDate.HasValue) entity.RecordDate = req.RecordDate.Value;
        if (req.GeneralHealthScore.HasValue) entity.GeneralHealthScore = req.GeneralHealthScore.Value;
        if (req.NutritionScore.HasValue) entity.NutritionScore = req.NutritionScore.Value;
        if (req.SleepQualityScore.HasValue) entity.SleepQualityScore = req.SleepQualityScore.Value;
        if (req.EnergyLevelScore.HasValue) entity.EnergyLevelScore = req.EnergyLevelScore.Value;
        if (req.HeightCm.HasValue) entity.HeightCm = req.HeightCm.Value;
        if (req.WeightKg.HasValue) entity.WeightKg = req.WeightKg.Value;
        if (req.Bmi.HasValue) entity.Bmi = req.Bmi.Value;
        if (req.MedicalCheckupDone.HasValue) entity.MedicalCheckupDone = req.MedicalCheckupDone.Value;
        if (req.DentalCheckupDone.HasValue) entity.DentalCheckupDone = req.DentalCheckupDone.Value;
        if (req.PsychologicalCheckupDone.HasValue) entity.PsychologicalCheckupDone = req.PsychologicalCheckupDone.Value;
        if (req.Notes != null) entity.Notes = req.Notes;
        await _db.SaveChangesAsync();
        return new HealthRecordDto(entity.HealthRecordId, entity.ResidentId, entity.Resident.InternalCode, entity.RecordDate, entity.GeneralHealthScore, entity.NutritionScore, entity.SleepQualityScore, entity.EnergyLevelScore, entity.HeightCm, entity.WeightKg, entity.Bmi, entity.MedicalCheckupDone, entity.DentalCheckupDone, entity.PsychologicalCheckupDone, entity.Notes);
    }

    // ── Intervention Plans ──

    public async Task<PagedResult<InterventionPlanDto>> GetInterventionPlansAsync(int page, int pageSize, int? residentId, string? status)
    {
        var query = _db.InterventionPlans.Include(p => p.Resident).AsQueryable();
        if (residentId.HasValue) query = query.Where(p => p.ResidentId == residentId.Value);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(p => p.Status == status);
        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var items = await query.OrderByDescending(p => p.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new InterventionPlanDto(p.PlanId, p.ResidentId, p.Resident.InternalCode, p.PlanCategory, p.PlanDescription, p.ServicesProvided, p.TargetValue, p.TargetDate, p.Status, p.CaseConferenceDate, p.CreatedAt, p.UpdatedAt))
            .ToListAsync();
        return new PagedResult<InterventionPlanDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<InterventionPlanDto> CreateInterventionPlanAsync(CreateInterventionPlanRequest req)
    {
        var now = DateTime.UtcNow;
        var entity = new InterventionPlan { ResidentId = req.ResidentId, PlanCategory = req.PlanCategory, PlanDescription = req.PlanDescription, ServicesProvided = req.ServicesProvided, TargetValue = req.TargetValue, TargetDate = req.TargetDate, Status = req.Status, CaseConferenceDate = req.CaseConferenceDate, CreatedAt = now, UpdatedAt = now };
        _db.InterventionPlans.Add(entity);
        await _db.SaveChangesAsync();
        var resident = await _db.Residents.FindAsync(entity.ResidentId);
        return new InterventionPlanDto(entity.PlanId, entity.ResidentId, resident?.InternalCode, entity.PlanCategory, entity.PlanDescription, entity.ServicesProvided, entity.TargetValue, entity.TargetDate, entity.Status, entity.CaseConferenceDate, entity.CreatedAt, entity.UpdatedAt);
    }

    public async Task<InterventionPlanDto?> UpdateInterventionPlanAsync(int id, UpdateInterventionPlanRequest req)
    {
        var entity = await _db.InterventionPlans.Include(p => p.Resident).FirstOrDefaultAsync(p => p.PlanId == id);
        if (entity == null) return null;
        if (req.PlanCategory != null) entity.PlanCategory = req.PlanCategory;
        if (req.PlanDescription != null) entity.PlanDescription = req.PlanDescription;
        if (req.ServicesProvided != null) entity.ServicesProvided = req.ServicesProvided;
        if (req.TargetValue.HasValue) entity.TargetValue = req.TargetValue.Value;
        if (req.TargetDate.HasValue) entity.TargetDate = req.TargetDate.Value;
        if (req.Status != null) entity.Status = req.Status;
        if (req.CaseConferenceDate.HasValue) entity.CaseConferenceDate = req.CaseConferenceDate.Value;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new InterventionPlanDto(entity.PlanId, entity.ResidentId, entity.Resident.InternalCode, entity.PlanCategory, entity.PlanDescription, entity.ServicesProvided, entity.TargetValue, entity.TargetDate, entity.Status, entity.CaseConferenceDate, entity.CreatedAt, entity.UpdatedAt);
    }

    // ── Incident Reports ──

    public async Task<PagedResult<IncidentReportDto>> GetIncidentReportsAsync(int page, int pageSize, int? residentId, string? severity, string? incidentType)
    {
        var query = _db.IncidentReports.Include(i => i.Resident).Include(i => i.Safehouse).AsQueryable();
        if (residentId.HasValue) query = query.Where(i => i.ResidentId == residentId.Value);
        if (!string.IsNullOrWhiteSpace(severity)) query = query.Where(i => i.Severity == severity);
        if (!string.IsNullOrWhiteSpace(incidentType)) query = query.Where(i => i.IncidentType == incidentType);
        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var items = await query.OrderByDescending(i => i.IncidentDate).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(i => new IncidentReportDto(i.IncidentId, i.ResidentId, i.Resident.InternalCode, i.SafehouseId, i.Safehouse.Name, i.IncidentDate, i.IncidentType, i.Severity, i.Description, i.ResponseTaken, i.Resolved, i.ResolutionDate, i.ReportedBy, i.FollowUpRequired))
            .ToListAsync();
        return new PagedResult<IncidentReportDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<IncidentReportDto> CreateIncidentReportAsync(CreateIncidentReportRequest req)
    {
        var entity = new IncidentReport { ResidentId = req.ResidentId, SafehouseId = req.SafehouseId, IncidentDate = req.IncidentDate, IncidentType = req.IncidentType, Severity = req.Severity, Description = req.Description, ResponseTaken = req.ResponseTaken, Resolved = req.Resolved, ResolutionDate = req.ResolutionDate, ReportedBy = req.ReportedBy, FollowUpRequired = req.FollowUpRequired };
        _db.IncidentReports.Add(entity);
        await _db.SaveChangesAsync();
        var resident = await _db.Residents.FindAsync(entity.ResidentId);
        var safehouse = await _db.Safehouses.FindAsync(entity.SafehouseId);
        return new IncidentReportDto(entity.IncidentId, entity.ResidentId, resident?.InternalCode, entity.SafehouseId, safehouse?.Name, entity.IncidentDate, entity.IncidentType, entity.Severity, entity.Description, entity.ResponseTaken, entity.Resolved, entity.ResolutionDate, entity.ReportedBy, entity.FollowUpRequired);
    }

    public async Task<IncidentReportDto?> UpdateIncidentReportAsync(int id, UpdateIncidentReportRequest req)
    {
        var entity = await _db.IncidentReports.Include(i => i.Resident).Include(i => i.Safehouse).FirstOrDefaultAsync(i => i.IncidentId == id);
        if (entity == null) return null;
        if (req.IncidentDate.HasValue) entity.IncidentDate = req.IncidentDate.Value;
        if (req.IncidentType != null) entity.IncidentType = req.IncidentType;
        if (req.Severity != null) entity.Severity = req.Severity;
        if (req.Description != null) entity.Description = req.Description;
        if (req.ResponseTaken != null) entity.ResponseTaken = req.ResponseTaken;
        if (req.Resolved.HasValue) entity.Resolved = req.Resolved.Value;
        if (req.ResolutionDate.HasValue) entity.ResolutionDate = req.ResolutionDate.Value;
        if (req.ReportedBy != null) entity.ReportedBy = req.ReportedBy;
        if (req.FollowUpRequired.HasValue) entity.FollowUpRequired = req.FollowUpRequired.Value;
        await _db.SaveChangesAsync();
        return new IncidentReportDto(entity.IncidentId, entity.ResidentId, entity.Resident.InternalCode, entity.SafehouseId, entity.Safehouse.Name, entity.IncidentDate, entity.IncidentType, entity.Severity, entity.Description, entity.ResponseTaken, entity.Resolved, entity.ResolutionDate, entity.ReportedBy, entity.FollowUpRequired);
    }

    public async Task<bool> DeleteIncidentReportAsync(int id)
    {
        var entity = await _db.IncidentReports.FindAsync(id);
        if (entity == null) return false;
        _db.IncidentReports.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }
}
