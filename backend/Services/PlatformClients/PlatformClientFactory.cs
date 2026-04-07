namespace Pharos.Api.Services.PlatformClients;

public interface IPlatformClientFactory
{
    ISocialPlatformClient? GetClient(string platform);
    IReadOnlyList<string> SupportedPlatforms { get; }
}

public class PlatformClientFactory : IPlatformClientFactory
{
    private readonly Dictionary<string, ISocialPlatformClient> _clients;

    public PlatformClientFactory(IEnumerable<ISocialPlatformClient> clients)
    {
        _clients = clients.ToDictionary(
            c => c.PlatformName.ToLowerInvariant(),
            c => c);
    }

    public ISocialPlatformClient? GetClient(string platform)
    {
        _clients.TryGetValue(platform.ToLowerInvariant(), out var client);
        return client;
    }

    public IReadOnlyList<string> SupportedPlatforms =>
        _clients.Values.Select(c => c.PlatformName).ToList().AsReadOnly();
}
