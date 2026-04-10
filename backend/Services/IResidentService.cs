using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface IResidentService
{
    Task<PagedResult<ResidentDto>> GetAllAsync(int page, int pageSize, string? caseStatus, string? riskLevel, int? safehouseId, string? search);
    Task<ResidentDetailDto?> GetByIdAsync(int id);
    Task<ResidentSummaryDto?> GetSummaryAsync(int id);
    Task<ResidentDto> CreateAsync(CreateResidentRequest request);
    Task<ResidentDto?> UpdateAsync(int id, UpdateResidentRequest request);
    Task<bool> DeleteAsync(int id);

    // Process Recordings
    Task<PagedResult<ProcessRecordingDto>> GetProcessRecordingsAsync(int page, int pageSize, int? residentId, string? sessionType, string? search, string? socialWorker = null, string? emotionalState = null, DateTime? startDate = null, DateTime? endDate = null, bool? concernsFlagged = null, bool? progressNoted = null);
    Task<ProcessRecordingDto?> GetProcessRecordingByIdAsync(int id);
    Task<ProcessRecordingDto> CreateProcessRecordingAsync(CreateProcessRecordingRequest request);
    Task<ProcessRecordingDto?> UpdateProcessRecordingAsync(int id, UpdateProcessRecordingRequest request);

    // Home Visitations
    Task<PagedResult<HomeVisitationDto>> GetHomeVisitationsAsync(int page, int pageSize, int? residentId, string? visitType, string? search);
    Task<HomeVisitationDto> CreateHomeVisitationAsync(CreateHomeVisitationRequest request);
    Task<HomeVisitationDto?> UpdateHomeVisitationAsync(int id, UpdateHomeVisitationRequest request);

    // Education Records
    Task<PagedResult<EducationRecordDto>> GetEducationRecordsAsync(int page, int pageSize, int? residentId);
    Task<EducationRecordDto> CreateEducationRecordAsync(CreateEducationRecordRequest request);
    Task<EducationRecordDto?> UpdateEducationRecordAsync(int id, UpdateEducationRecordRequest request);

    // Health Records
    Task<PagedResult<HealthRecordDto>> GetHealthRecordsAsync(int page, int pageSize, int? residentId);
    Task<HealthRecordDto> CreateHealthRecordAsync(CreateHealthRecordRequest request);
    Task<HealthRecordDto?> UpdateHealthRecordAsync(int id, UpdateHealthRecordRequest request);

    // Intervention Plans
    Task<PagedResult<InterventionPlanDto>> GetInterventionPlansAsync(int page, int pageSize, int? residentId, string? status);
    Task<InterventionPlanDto> CreateInterventionPlanAsync(CreateInterventionPlanRequest request);
    Task<InterventionPlanDto?> UpdateInterventionPlanAsync(int id, UpdateInterventionPlanRequest request);

    // Incident Reports
    Task<PagedResult<IncidentReportDto>> GetIncidentReportsAsync(int page, int pageSize, int? residentId, string? severity, string? incidentType);
    Task<IncidentReportDto> CreateIncidentReportAsync(CreateIncidentReportRequest request);
    Task<IncidentReportDto?> UpdateIncidentReportAsync(int id, UpdateIncidentReportRequest request);
    Task<bool> DeleteIncidentReportAsync(int id);
}
