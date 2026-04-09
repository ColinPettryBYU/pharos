using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/upload")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/quicktime", "video/webm"
    };
    private const long MaxFileSize = 100 * 1024 * 1024; // 100 MB

    public UploadController(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("media")]
    [RequestSizeLimit(100 * 1024 * 1024)]
    public async Task<IActionResult> UploadMedia(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (file.Length > MaxFileSize)
            return BadRequest(new { message = "File exceeds 100 MB limit." });

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new { message = $"File type '{file.ContentType}' is not supported. Use JPEG, PNG, GIF, WebP, MP4, MOV, or WebM." });

        var supabaseUrl = _config["Supabase__Url"];
        var supabaseKey = _config["Supabase__ServiceKey"];

        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
            return StatusCode(500, new { message = "Supabase storage is not configured." });

        var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".bin";
        var objectPath = $"social-media/{Guid.NewGuid()}{ext}";

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("apikey", supabaseKey);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {supabaseKey}");

        using var stream = file.OpenReadStream();
        var content = new StreamContent(stream);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);

        var uploadUrl = $"{supabaseUrl}/storage/v1/object/media/{objectPath}";
        var response = await client.PostAsync(uploadUrl, content);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            return StatusCode(502, new { message = "Upload to storage failed.", detail = errorBody });
        }

        var publicUrl = $"{supabaseUrl}/storage/v1/object/public/media/{objectPath}";

        return Ok(new { url = publicUrl, path = objectPath, content_type = file.ContentType, size = file.Length });
    }
}
