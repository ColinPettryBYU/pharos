using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.Models;
using Pharos.Api.Services.PlatformClients;

namespace Pharos.Api.Services;

public interface ISocialCredentialService
{
    Task<(string? ClientId, string? ClientSecret)> GetCredentialsAsync(string platform);
    Task SaveCredentialsAsync(string platform, string clientId, string clientSecret);
    Task<Dictionary<string, bool>> GetCredentialStatusAsync();
}

public class SocialCredentialService : ISocialCredentialService
{
    private readonly PharosDbContext _db;
    private readonly IConfiguration _config;
    private readonly ITokenEncryptionService _tokenService;

    private static readonly Dictionary<string, (string IdKey, string SecretKey)> ConfigKeyMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["facebook"] = ("SocialMedia:Meta:AppId", "SocialMedia:Meta:AppSecret"),
        ["instagram"] = ("SocialMedia:Meta:AppId", "SocialMedia:Meta:AppSecret"),
        ["linkedin"] = ("SocialMedia:LinkedIn:ClientId", "SocialMedia:LinkedIn:ClientSecret"),
        ["youtube"] = ("SocialMedia:Google:ClientId", "SocialMedia:Google:ClientSecret"),
        ["tiktok"] = ("SocialMedia:TikTok:ClientKey", "SocialMedia:TikTok:ClientSecret"),
        ["twitter"] = ("SocialMedia:Twitter:ClientId", "SocialMedia:Twitter:ClientSecret"),
    };

    public SocialCredentialService(
        PharosDbContext db,
        IConfiguration config,
        ITokenEncryptionService tokenService)
    {
        _db = db;
        _config = config;
        _tokenService = tokenService;
    }

    public async Task<(string? ClientId, string? ClientSecret)> GetCredentialsAsync(string platform)
    {
        var key = platform.ToLowerInvariant();

        if (ConfigKeyMap.TryGetValue(key, out var configKeys))
        {
            var configId = _config[configKeys.IdKey];
            var configSecret = _config[configKeys.SecretKey];
            if (!string.IsNullOrWhiteSpace(configId) && !string.IsNullOrWhiteSpace(configSecret))
                return (configId, configSecret);
        }

        var dbCred = await _db.SocialMediaCredentials
            .FirstOrDefaultAsync(c => c.Platform.ToLower() == key);

        if (dbCred == null)
            return (null, null);

        return (
            _tokenService.Decrypt(dbCred.EncryptedClientId),
            _tokenService.Decrypt(dbCred.EncryptedClientSecret)
        );
    }

    public async Task SaveCredentialsAsync(string platform, string clientId, string clientSecret)
    {
        var key = platform.ToLowerInvariant();
        var existing = await _db.SocialMediaCredentials
            .FirstOrDefaultAsync(c => c.Platform.ToLower() == key);

        if (existing != null)
        {
            existing.EncryptedClientId = _tokenService.Encrypt(clientId);
            existing.EncryptedClientSecret = _tokenService.Encrypt(clientSecret);
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.SocialMediaCredentials.Add(new SocialMediaCredential
            {
                Platform = key,
                EncryptedClientId = _tokenService.Encrypt(clientId),
                EncryptedClientSecret = _tokenService.Encrypt(clientSecret),
                UpdatedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task<Dictionary<string, bool>> GetCredentialStatusAsync()
    {
        var dbCreds = await _db.SocialMediaCredentials
            .Select(c => c.Platform.ToLower())
            .ToListAsync();

        var result = new Dictionary<string, bool>();
        foreach (var (platform, configKeys) in ConfigKeyMap)
        {
            var hasConfig = !string.IsNullOrWhiteSpace(_config[configKeys.IdKey]);
            var hasDb = dbCreds.Contains(platform);
            result[platform] = hasConfig || hasDb;
        }

        return result;
    }
}
