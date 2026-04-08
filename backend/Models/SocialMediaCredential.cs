namespace Pharos.Api.Models;

public class SocialMediaCredential
{
    public int Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string EncryptedClientId { get; set; } = string.Empty;
    public string EncryptedClientSecret { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
