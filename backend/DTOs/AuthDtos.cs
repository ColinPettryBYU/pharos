namespace Pharos.Api.DTOs;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(string Email, string Password, string DisplayName);

public record LoginResponse(
    bool Success,
    string? Message = null,
    bool RequiresMfa = false,
    UserInfoDto? User = null
);

public record UserInfoDto(
    string Id,
    string Email,
    string? DisplayName,
    IEnumerable<string> Roles,
    int? LinkedSupporterId,
    bool MfaEnabled
);

public record MfaSetupDto(string SharedKey, string AuthenticatorUri);

public record MfaVerifyRequest(string Code);

public record GoogleLoginRequest(string IdToken);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
