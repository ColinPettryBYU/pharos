using Microsoft.AspNetCore.DataProtection;

namespace Pharos.Api.Services.PlatformClients;

public interface ITokenEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}

public class TokenEncryptionService : ITokenEncryptionService
{
    private readonly IDataProtector _protector;

    public TokenEncryptionService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("Pharos.SocialMediaTokens");
    }

    public string Encrypt(string plainText) => _protector.Protect(plainText);

    public string Decrypt(string cipherText)
    {
        try
        {
            return _protector.Unprotect(cipherText);
        }
        catch
        {
            return cipherText;
        }
    }
}
