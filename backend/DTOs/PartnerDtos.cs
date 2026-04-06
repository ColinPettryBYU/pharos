namespace Pharos.Api.DTOs;

public record PartnerDto(
    int PartnerId,
    string PartnerName,
    string PartnerType,
    string RoleType,
    string? ContactName,
    string? Email,
    string? Phone,
    string? Region,
    string Status,
    DateTime StartDate,
    DateTime? EndDate,
    string? Notes,
    int AssignmentCount
);

public record CreatePartnerRequest(
    string PartnerName,
    string PartnerType,
    string RoleType,
    string? ContactName,
    string? Email,
    string? Phone,
    string? Region,
    string Status,
    DateTime StartDate,
    DateTime? EndDate,
    string? Notes
);

public record UpdatePartnerRequest(
    string? PartnerName,
    string? PartnerType,
    string? RoleType,
    string? ContactName,
    string? Email,
    string? Phone,
    string? Region,
    string? Status,
    DateTime? EndDate,
    string? Notes
);

public record PartnerAssignmentDto(
    int AssignmentId,
    int PartnerId,
    string? PartnerName,
    int? SafehouseId,
    string? SafehouseName,
    string ProgramArea,
    DateTime AssignmentStart,
    DateTime? AssignmentEnd,
    string? ResponsibilityNotes,
    bool IsPrimary,
    string Status
);
