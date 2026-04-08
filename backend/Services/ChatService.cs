using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;

namespace Pharos.Api.Services;

public interface IChatService
{
    Task<ChatResponse> SendMessageAsync(ChatRequest request, string? userId = null);
}

public class ChatService : IChatService
{
    private readonly PharosDbContext _db;
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<ChatService> _logger;

    public ChatService(PharosDbContext db, HttpClient http, IConfiguration config, ILogger<ChatService> logger)
    {
        _db = db;
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<ChatResponse> SendMessageAsync(ChatRequest request, string? userId = null)
    {
        var apiKey = _config["Google:GeminiApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return new ChatResponse([new TextBlock("AI chat is not configured. Set the Google__GeminiApiKey environment variable (or Google:GeminiApiKey in appsettings).")]);

        var context = await BuildDatabaseContextAsync(request.Message);
        var systemPrompt = BuildSystemPrompt(context);
        var contents = BuildContents(request);

        var geminiRequest = new
        {
            contents,
            generationConfig = new
            {
                temperature = 0.7,
                maxOutputTokens = 4096,
            },
            systemInstruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            }
        };

        var model = "gemini-2.0-flash";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        try
        {
            _logger.LogInformation("Calling Gemini API for user message: {Msg}", request.Message[..Math.Min(80, request.Message.Length)]);
            var httpResponse = await _http.PostAsJsonAsync(url, geminiRequest);
            var responseJson = await httpResponse.Content.ReadAsStringAsync();

            if (!httpResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini API returned {StatusCode}: {Body}", httpResponse.StatusCode, responseJson);
                return new ChatResponse([new TextBlock($"Sorry, the AI service returned an error (HTTP {(int)httpResponse.StatusCode}). Check the server logs or verify your Google__GeminiApiKey is valid.")]);
            }

            var blocks = ParseGeminiResponse(responseJson);
            return new ChatResponse(blocks);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error calling Gemini API");
            return new ChatResponse([new TextBlock("Sorry, I couldn't reach the AI service. Please check the server's network connectivity.")]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Gemini API");
            return new ChatResponse([new TextBlock("Sorry, I had trouble connecting to the AI service. Please try again.")]);
        }
    }

    private async Task<string> BuildDatabaseContextAsync(string message)
    {
        var sb = new StringBuilder();
        var lower = message.ToLowerInvariant();

        var residentCount = await _db.Residents.CountAsync();
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var safehouseCount = await _db.Safehouses.CountAsync();
        var donationCount = await _db.Donations.CountAsync();
        var totalDonations = await _db.Donations.SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0);
        var supporterCount = await _db.Supporters.CountAsync();
        var postCount = await _db.SocialMediaPosts.CountAsync();

        sb.AppendLine($"SUMMARY: {residentCount} total residents ({activeResidents} active), {safehouseCount} safehouses, {donationCount} donations (₱{totalDonations:N0} total), {supporterCount} supporters, {postCount} social media posts.");

        if (ContainsAny(lower, "resident", "caseload", "girl", "case", "reintegration", "safehouse"))
        {
            var residents = await _db.Residents
                .Select(r => new { r.ResidentId, r.CaseStatus, r.CaseCategory, r.CurrentRiskLevel, r.ReintegrationStatus, r.SafehouseId, r.PresentAge })
                .Take(100).ToListAsync();
            sb.AppendLine($"RESIDENTS (sample): {JsonSerializer.Serialize(residents)}");
        }

        if (ContainsAny(lower, "donor", "donation", "supporter", "contribut", "campaign", "fundrais"))
        {
            var topDonors = await _db.Donations
                .Include(d => d.Supporter)
                .GroupBy(d => d.Supporter!.DisplayName)
                .Select(g => new { Donor = g.Key, Total = g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0), Count = g.Count() })
                .OrderByDescending(x => x.Total)
                .Take(10).ToListAsync();
            sb.AppendLine($"TOP DONORS: {JsonSerializer.Serialize(topDonors)}");
        }

        if (ContainsAny(lower, "social", "post", "engagement", "platform", "facebook", "instagram", "tiktok"))
        {
            var platformStats = await _db.SocialMediaPosts
                .GroupBy(p => p.Platform)
                .Select(g => new { Platform = g.Key, Posts = g.Count(), AvgEngagement = g.Average(p => (double)(p.EngagementRate ?? 0)) })
                .ToListAsync();
            sb.AppendLine($"SOCIAL MEDIA BY PLATFORM: {JsonSerializer.Serialize(platformStats)}");
        }

        if (ContainsAny(lower, "health", "wellbeing", "education", "progress"))
        {
            var avgHealth = await _db.HealthWellbeingRecords.AverageAsync(h => (double)h.GeneralHealthScore);
            var avgEdu = await _db.EducationRecords.AverageAsync(e => (double)(e.ProgressPercent ?? 0));
            sb.AppendLine($"HEALTH avg score: {avgHealth:F1}/5.0, EDUCATION avg progress: {avgEdu:F1}%");
        }

        if (ContainsAny(lower, "incident", "safety", "behavior"))
        {
            var incidents = await _db.IncidentReports
                .GroupBy(i => i.IncidentType)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToListAsync();
            sb.AppendLine($"INCIDENTS BY TYPE: {JsonSerializer.Serialize(incidents)}");
        }

        return sb.ToString();
    }

    private static bool ContainsAny(string text, params string[] keywords)
        => keywords.Any(k => text.Contains(k));

    private static string BuildSystemPrompt(string dbContext)
    {
        return $@"You are Pharos AI, an assistant for a nonprofit organization that operates safe homes for girls who are survivors of abuse and trafficking in the Philippines.

You have access to the organization's database. Here is the current data:

{dbContext}

RESPONSE FORMAT:
You MUST respond with a JSON array of blocks. Each block has a ""type"" field. Supported types:
- {{ ""type"": ""text"", ""content"": ""Your narrative text here"" }}
- {{ ""type"": ""stat"", ""label"": ""Metric Name"", ""value"": ""42"", ""trend"": ""up"" or ""down"" or null, ""icon"": null }}
- {{ ""type"": ""table"", ""title"": ""Table Title"", ""headers"": [""Col1"", ""Col2""], ""rows"": [[""val1"", ""val2""]] }}
- {{ ""type"": ""list"", ""title"": ""List Title"", ""items"": [""Item 1"", ""Item 2""] }}

GUIDELINES:
- Use stat blocks for key numbers (counts, totals, averages)
- Use table blocks for comparisons or lists of entities
- Use text blocks for explanations and insights
- Use list blocks for action items or bullet points
- All currency values are in Philippine Pesos (₱)
- Keep responses concise and actionable
- Be empathetic — this data represents real children's lives
- Never fabricate data — only use what's provided in the context above";
    }

    private static List<object> BuildContents(ChatRequest request)
    {
        var contents = new List<object>();

        if (request.History != null)
        {
            foreach (var h in request.History)
            {
                contents.Add(new
                {
                    role = h.Role == "user" ? "user" : "model",
                    parts = new[] { new { text = h.Content } }
                });
            }
        }

        contents.Add(new
        {
            role = "user",
            parts = new[] { new { text = request.Message } }
        });

        return contents;
    }

    private List<ChatBlock> ParseGeminiResponse(string responseJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseJson);
            var candidates = doc.RootElement.GetProperty("candidates");
            var content = candidates[0].GetProperty("content");
            var parts = content.GetProperty("parts");
            var text = parts[0].GetProperty("text").GetString() ?? "";

            var blocks = new List<ChatBlock>();

            var cleaned = text.Trim();
            if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
            if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
            if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
            cleaned = cleaned.Trim();

            try
            {
                using var blockDoc = JsonDocument.Parse(cleaned);
                if (blockDoc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in blockDoc.RootElement.EnumerateArray())
                    {
                        var type = elem.GetProperty("type").GetString();
                        switch (type)
                        {
                            case "text":
                                blocks.Add(new TextBlock(elem.GetProperty("content").GetString() ?? ""));
                                break;
                            case "stat":
                                blocks.Add(new StatBlock(
                                    elem.GetProperty("label").GetString() ?? "",
                                    elem.GetProperty("value").GetString() ?? "",
                                    elem.TryGetProperty("trend", out var t) && t.ValueKind != JsonValueKind.Null ? t.GetString() : null,
                                    elem.TryGetProperty("icon", out var ic) && ic.ValueKind != JsonValueKind.Null ? ic.GetString() : null));
                                break;
                            case "table":
                                var headers = elem.GetProperty("headers").EnumerateArray()
                                    .Select(h => h.GetString() ?? "").ToList();
                                var rows = elem.GetProperty("rows").EnumerateArray()
                                    .Select(r => r.EnumerateArray().Select(c => c.ToString()).ToList())
                                    .ToList();
                                blocks.Add(new TableBlock(
                                    elem.GetProperty("title").GetString() ?? "", headers, rows));
                                break;
                            case "list":
                                var items = elem.GetProperty("items").EnumerateArray()
                                    .Select(i => i.GetString() ?? "").ToList();
                                blocks.Add(new ListBlock(
                                    elem.GetProperty("title").GetString() ?? "", items));
                                break;
                        }
                    }
                }
            }
            catch
            {
                blocks.Add(new TextBlock(text));
            }

            if (blocks.Count == 0)
                blocks.Add(new TextBlock(text));

            return blocks;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse Gemini response");
            return [new TextBlock("Sorry, I had trouble processing that request. Please try again.")];
        }
    }
}
