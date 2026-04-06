namespace Pharos.Api.DTOs;

/// <summary>
/// Standard paginated response wrapper for list endpoints.
/// </summary>
public record PagedResult<T>(
    IEnumerable<T> Data,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

/// <summary>
/// Standard API response envelope.
/// </summary>
public record ApiResponse<T>(
    T? Data,
    string? Message = null,
    IEnumerable<string>? Errors = null
);

/// <summary>
/// Standard API response without data payload.
/// </summary>
public record ApiMessage(
    string Message,
    IEnumerable<string>? Errors = null
);
