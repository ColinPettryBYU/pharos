namespace Pharos.Api.Models;

public class SocialMediaAccount
{
    public int Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string? AccountId { get; set; }
    public string EncryptedAccessToken { get; set; } = string.Empty;
    public string? EncryptedRefreshToken { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public string? PageId { get; set; }
    public string Status { get; set; } = "Active";
}
