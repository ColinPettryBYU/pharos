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
                maxOutputTokens = 8192,
            },
            systemInstruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            }
        };

        var model = "gemini-2.5-pro";
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

    private async Task<string> BuildDatabaseContextAsync(string _message)
    {
        var sb = new StringBuilder();
        var opts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

        // ── Safehouses (small table, always include all) ──
        var safehouses = await _db.Safehouses.ToListAsync();
        sb.AppendLine($"SAFEHOUSES ({safehouses.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(safehouses.Select(s => new { s.SafehouseId, s.Name, s.Region, s.City, s.Province, s.Status, s.CapacityGirls, s.CurrentOccupancy }), opts));

        // ── Residents (all — 60 rows) ──
        var residents = await _db.Residents.ToListAsync();
        sb.AppendLine($"\nRESIDENTS ({residents.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(residents.Select(r => new {
            r.ResidentId, r.SafehouseId, r.CaseStatus, r.CaseCategory, r.CurrentRiskLevel,
            r.InitialRiskLevel, r.ReintegrationStatus, r.ReintegrationType, r.PresentAge,
            r.Sex, r.DateOfAdmission, r.DateClosed, r.LengthOfStay,
            r.SubCatTrafficked, r.SubCatSexualAbuse, r.SubCatPhysicalAbuse, r.SubCatOrphaned,
            r.IsPwd, r.HasSpecialNeeds, r.AssignedSocialWorker
        }), opts));

        // ── Supporters (all — 60 rows) ──
        var supporters = await _db.Supporters.ToListAsync();
        sb.AppendLine($"\nSUPPORTERS ({supporters.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(supporters.Select(s => new {
            s.SupporterId, s.SupporterType, s.DisplayName, s.OrganizationName,
            s.RelationshipType, s.Region, s.Country, s.Status, s.AcquisitionChannel, s.FirstDonationDate
        }), opts));

        // ── Donations (all — 420 rows) ──
        var donations = await _db.Donations.ToListAsync();
        sb.AppendLine($"\nDONATIONS ({donations.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(donations.Select(d => new {
            d.DonationId, d.SupporterId, d.DonationType, d.DonationDate, d.IsRecurring,
            d.CampaignName, d.ChannelSource, d.Amount, d.EstimatedValue, d.ImpactUnit, d.ReferralPostId
        }), opts));

        // ── Donation Allocations (all — 521 rows) ──
        var allocations = await _db.DonationAllocations.ToListAsync();
        sb.AppendLine($"\nDONATION_ALLOCATIONS ({allocations.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(allocations.Select(a => new {
            a.AllocationId, a.DonationId, a.SafehouseId, a.ProgramArea, a.AmountAllocated
        }), opts));

        // ── Process Recordings (aggregated by resident — 2800+ rows is too much raw) ──
        var recAgg = await _db.ProcessRecordings
            .GroupBy(r => r.ResidentId)
            .Select(g => new {
                ResidentId = g.Key,
                SessionCount = g.Count(),
                AvgDuration = g.Average(r => (double)r.SessionDurationMinutes),
                MostRecentSession = g.Max(r => r.SessionDate),
                IndividualSessions = g.Count(r => r.SessionType == "Individual"),
                GroupSessions = g.Count(r => r.SessionType == "Group"),
            }).ToListAsync();
        sb.AppendLine($"\nPROCESS_RECORDINGS (aggregated by resident, {recAgg.Count} groups):");
        sb.AppendLine(JsonSerializer.Serialize(recAgg, opts));

        // ── Home Visitations (aggregated by resident — 1300+ rows) ──
        var visitAgg = await _db.HomeVisitations
            .GroupBy(v => v.ResidentId)
            .Select(g => new {
                ResidentId = g.Key,
                VisitCount = g.Count(),
                MostRecentVisit = g.Max(v => v.VisitDate),
                FavorableOutcomes = g.Count(v => v.VisitOutcome == "Favorable"),
                UnfavorableOutcomes = g.Count(v => v.VisitOutcome == "Unfavorable"),
            }).ToListAsync();
        sb.AppendLine($"\nHOME_VISITATIONS (aggregated by resident, {visitAgg.Count} groups):");
        sb.AppendLine(JsonSerializer.Serialize(visitAgg, opts));

        // ── Education Records (all — 534 rows) ──
        var eduRecords = await _db.EducationRecords.ToListAsync();
        sb.AppendLine($"\nEDUCATION_RECORDS ({eduRecords.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(eduRecords.Select(e => new {
            e.EducationRecordId, e.ResidentId, e.RecordDate, e.EducationLevel,
            e.EnrollmentStatus, e.AttendanceRate, e.ProgressPercent, e.CompletionStatus
        }), opts));

        // ── Health/Wellbeing Records (all — 534 rows) ──
        var healthRecords = await _db.HealthWellbeingRecords.ToListAsync();
        sb.AppendLine($"\nHEALTH_WELLBEING_RECORDS ({healthRecords.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(healthRecords.Select(h => new {
            h.HealthRecordId, h.ResidentId, h.RecordDate, h.GeneralHealthScore,
            h.NutritionScore, h.SleepQualityScore, h.EnergyLevelScore, h.Bmi,
            h.MedicalCheckupDone, h.DentalCheckupDone, h.PsychologicalCheckupDone
        }), opts));

        // ── Intervention Plans (all — 180 rows) ──
        var plans = await _db.InterventionPlans.ToListAsync();
        sb.AppendLine($"\nINTERVENTION_PLANS ({plans.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(plans.Select(p => new {
            p.PlanId, p.ResidentId, p.PlanCategory, p.PlanDescription,
            p.ServicesProvided, p.Status, p.TargetDate, p.CaseConferenceDate
        }), opts));

        // ── Incident Reports (all — 100 rows) ──
        var incidents = await _db.IncidentReports.ToListAsync();
        sb.AppendLine($"\nINCIDENT_REPORTS ({incidents.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(incidents.Select(i => new {
            i.IncidentId, i.ResidentId, i.SafehouseId, i.IncidentDate, i.IncidentType,
            i.Severity, i.Resolved, i.FollowUpRequired
        }), opts));

        // ── Social Media Posts (all — 812 rows, key fields only) ──
        var posts = await _db.SocialMediaPosts.ToListAsync();
        sb.AppendLine($"\nSOCIAL_MEDIA_POSTS ({posts.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(posts.Select(p => new {
            p.PostId, p.Platform, p.CreatedAt, p.PostType, p.MediaType,
            p.ContentTopic, p.SentimentTone, p.CampaignName, p.IsBoosted,
            p.Impressions, p.Reach, p.Likes, p.Comments, p.Shares, p.EngagementRate,
            p.DonationReferrals, p.EstimatedDonationValuePhp
        }), opts));

        // ── Partners (all — 30 rows) ──
        var partners = await _db.Partners.ToListAsync();
        sb.AppendLine($"\nPARTNERS ({partners.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(partners.Select(p => new {
            p.PartnerId, p.PartnerName, p.PartnerType, p.RoleType, p.Region, p.Status
        }), opts));

        // ── Safehouse Monthly Metrics (all — 450 rows) ──
        var metrics = await _db.SafehouseMonthlyMetrics.ToListAsync();
        sb.AppendLine($"\nSAFEHOUSE_MONTHLY_METRICS ({metrics.Count} rows):");
        sb.AppendLine(JsonSerializer.Serialize(metrics.Select(m => new {
            m.MetricId, m.SafehouseId, m.MonthStart, m.ActiveResidents,
            m.AvgEducationProgress, m.AvgHealthScore, m.ProcessRecordingCount,
            m.HomeVisitationCount, m.IncidentCount
        }), opts));

        // ── ML Predictions ──
        var churnScores = await _db.DonorChurnScores.ToListAsync();
        if (churnScores.Count > 0)
        {
            sb.AppendLine($"\nDONOR_CHURN_SCORES ({churnScores.Count} rows):");
            sb.AppendLine(JsonSerializer.Serialize(churnScores.Select(c => new {
                c.SupporterId, c.ChurnRiskScore, c.RiskTier
            }), opts));
        }

        var readiness = await _db.ResidentReadinessScores.ToListAsync();
        if (readiness.Count > 0)
        {
            sb.AppendLine($"\nRESIDENT_READINESS_SCORES ({readiness.Count} rows):");
            sb.AppendLine(JsonSerializer.Serialize(readiness.Select(r => new {
                r.ResidentId, r.ReadinessScore, r.ReadinessTier
            }), opts));
        }

        return sb.ToString();
    }

    private static string BuildSystemPrompt(string dbContext)
    {
        return $@"You are Pharos AI, an intelligent assistant for Pharos — a nonprofit organization that operates safe homes for girls who are survivors of abuse and trafficking in the Philippines.

You have FULL ACCESS to the organization's live database. Below is the complete data from every table. Use it to answer any question with real numbers — do not estimate or guess. If the user asks about specific residents, donors, safehouses, incidents, donations, social media posts, health records, education records, intervention plans, home visitations, or ML predictions, you have the data right here. Cross-reference tables when needed (e.g., join donations to supporters by supporter_id, join residents to safehouses by safehouse_id, etc.).

DATABASE CONTENTS:

{dbContext}

RESPONSE FORMAT:
You MUST respond with a JSON array of blocks. Each block has a ""type"" field. Supported types:
- {{ ""type"": ""text"", ""content"": ""Your narrative text here"" }}
- {{ ""type"": ""stat"", ""label"": ""Metric Name"", ""value"": ""42"", ""trend"": ""up"" or ""down"" or null, ""icon"": null }}
- {{ ""type"": ""table"", ""title"": ""Table Title"", ""headers"": [""Col1"", ""Col2""], ""rows"": [[""val1"", ""val2""]] }}
- {{ ""type"": ""list"", ""title"": ""List Title"", ""items"": [""Item 1"", ""Item 2""] }}
- {{ ""type"": ""chart"", ""chart_type"": ""bar"", ""title"": ""Chart Title"", ""x_key"": ""name"", ""y_keys"": [""value""], ""data"": [{{ ""name"": ""A"", ""value"": 10 }}] }}

CHART BLOCK DETAILS:
chart_type can be ""bar"", ""line"", ""area"", or ""pie"".
data is an array of objects. x_key is the field used for labels/x-axis. y_keys are the numeric fields to plot.
Use charts when showing trends over time (line/area), comparisons between categories (bar), or proportional breakdowns (pie).
Examples of when to use charts:
- Donation trends over months → line or area chart
- Safehouse occupancy comparison → bar chart
- Donation type breakdown → pie chart
- Engagement over time → line chart
- Risk level distribution → bar or pie chart
- Education progress by safehouse → bar chart

GUIDELINES:
- Use stat blocks for key numbers (counts, totals, averages)
- Use table blocks for comparisons or lists of entities
- Use text blocks for explanations and insights
- Use list blocks for action items or bullet points
- Use chart blocks when visualizing trends, comparisons, or distributions
- All currency values are in Philippine Pesos (₱)
- Keep responses concise and actionable
- Be empathetic — this data represents real children's lives
- Never fabricate data — only use what's provided in the context above

CRITICAL OUTPUT RULE: Your ENTIRE response must be ONLY the raw JSON array. Do NOT include any text, explanation, greeting, or markdown fences before or after the JSON. Start your response with the [ character and end with the ] character. No exceptions.";
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

            // Strip markdown fences and extract the JSON array from anywhere in the text.
            // Gemini often returns prose before/after: "Here are the stats:\n```json\n[...]\n```"
            var jsonStart = cleaned.IndexOf('[');
            var jsonEnd = cleaned.LastIndexOf(']');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                cleaned = cleaned[jsonStart..(jsonEnd + 1)];
            }
            else
            {
                // Fallback: strip fences the old way
                if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
                else if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
                if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
                cleaned = cleaned.Trim();
            }

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
                            case "chart":
                                var chartType = elem.TryGetProperty("chart_type", out var ct) ? ct.GetString() ?? "bar" : "bar";
                                var chartTitle = elem.TryGetProperty("title", out var ctTitle) && ctTitle.ValueKind != JsonValueKind.Null ? ctTitle.GetString() : null;
                                var xKey = elem.TryGetProperty("x_key", out var xk) ? xk.GetString() : "name";
                                var yKeys = elem.TryGetProperty("y_keys", out var yk) && yk.ValueKind == JsonValueKind.Array
                                    ? yk.EnumerateArray().Select(y => y.GetString() ?? "").ToList() : null;
                                var chartColors = elem.TryGetProperty("colors", out var cc) && cc.ValueKind == JsonValueKind.Array
                                    ? cc.EnumerateArray().Select(c => c.GetString() ?? "").ToList() : null;
                                var chartData = new List<Dictionary<string, object>>();
                                if (elem.TryGetProperty("data", out var dataArr) && dataArr.ValueKind == JsonValueKind.Array)
                                {
                                    foreach (var dataItem in dataArr.EnumerateArray())
                                    {
                                        var dict = new Dictionary<string, object>();
                                        foreach (var prop in dataItem.EnumerateObject())
                                        {
                                            dict[prop.Name] = prop.Value.ValueKind switch
                                            {
                                                JsonValueKind.Number => prop.Value.GetDouble(),
                                                JsonValueKind.True => true,
                                                JsonValueKind.False => false,
                                                _ => prop.Value.GetString() ?? ""
                                            };
                                        }
                                        chartData.Add(dict);
                                    }
                                }
                                blocks.Add(new ChartBlock(chartType, chartTitle, xKey, yKeys, chartData, chartColors));
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
