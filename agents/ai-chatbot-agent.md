# AI Chatbot Agent — Pharos

> Reference `CLAUDE.md` for project context, database schema, and tech stack.
> Reference `agents/backend-agent.md` for API patterns and service structure.
> Reference `agents/frontend-agent.md` for UI patterns and component library.

You are responsible for building a new AI-powered chatbot page that lets staff ask questions about the organization's data and get rich, structured responses powered by Google Gemini.

---

## Architecture Overview

```
User types question in ChatPage
  → Frontend sends POST /api/admin/chat with { message, history[] }
  → Backend ChatService:
      1. Builds system prompt with database schema + summary stats
      2. Queries relevant DB tables based on message keywords
      3. Sends user message + context to Google Gemini API
      4. Parses Gemini's response into structured blocks
  → Returns JSON: { blocks: [TextBlock, StatBlock, TableBlock, ...] }
  → Frontend renders each block as a rich UI component
```

---

## Backend Implementation

### 1. Configuration

Add to `backend/.env`:
```
Google__GeminiApiKey=your-gemini-api-key-here
```

The key is obtained from [Google AI Studio](https://aistudio.google.com/apikey).

### 2. DTOs — `backend/DTOs/ChatDtos.cs`

Create this new file:

```csharp
namespace Pharos.Api.DTOs;

public record ChatRequest(
    string Message,
    List<ChatHistoryItem>? History
);

public record ChatHistoryItem(
    string Role,  // "user" or "assistant"
    string Content
);

public record ChatResponse(
    List<ChatBlock> Blocks
);

public abstract record ChatBlock(string Type);

public record TextBlock(string Content) : ChatBlock("text");

public record StatBlock(
    string Label,
    string Value,
    string? Trend,
    string? Icon
) : ChatBlock("stat");

public record TableBlock(
    string Title,
    List<string> Headers,
    List<List<string>> Rows
) : ChatBlock("table");

public record ListBlock(
    string Title,
    List<string> Items
) : ChatBlock("list");
```

Note: `System.Text.Json` needs polymorphic serialization for the `ChatBlock` hierarchy. Add `[JsonDerivedType]` attributes:

```csharp
[JsonDerivedType(typeof(TextBlock), "text")]
[JsonDerivedType(typeof(StatBlock), "stat")]
[JsonDerivedType(typeof(TableBlock), "table")]
[JsonDerivedType(typeof(ListBlock), "list")]
public abstract record ChatBlock(string Type);
```

### 3. Service — `backend/Services/ChatService.cs`

Create `IChatService` and `ChatService`:

```csharp
public interface IChatService
{
    Task<ChatResponse> SendMessageAsync(ChatRequest request);
}
```

**`ChatService` implementation:**

```csharp
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

    public async Task<ChatResponse> SendMessageAsync(ChatRequest request)
    {
        var apiKey = _config["Google:GeminiApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return new ChatResponse(new List<ChatBlock> { new TextBlock("AI chat is not configured. Please add a Google Gemini API key.") });

        // Build context from database
        var context = await BuildDatabaseContextAsync(request.Message);

        // Build Gemini request
        var systemPrompt = BuildSystemPrompt(context);
        var contents = BuildContents(systemPrompt, request);

        // Call Gemini API
        var geminiRequest = new
        {
            contents,
            generationConfig = new
            {
                temperature = 0.7,
                maxOutputTokens = 2048,
                responseMimeType = "application/json"
            },
            systemInstruction = new
            {
                parts = new[] { new { text = systemPrompt } }
            }
        };

        var model = "gemini-2.0-flash";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var httpResponse = await _http.PostAsJsonAsync(url, geminiRequest);
        var responseJson = await httpResponse.Content.ReadAsStringAsync();

        // Parse Gemini response and extract blocks
        var blocks = ParseGeminiResponse(responseJson);
        return new ChatResponse(blocks);
    }
}
```

**Key helper methods in ChatService:**

#### `BuildDatabaseContextAsync` — Queries relevant data based on message keywords

```csharp
private async Task<string> BuildDatabaseContextAsync(string message)
{
    var sb = new StringBuilder();
    var lower = message.ToLowerInvariant();

    // Always include summary stats
    var residentCount = await _db.Residents.CountAsync();
    var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
    var safehouseCount = await _db.Safehouses.CountAsync();
    var donationCount = await _db.Donations.CountAsync();
    var totalDonations = await _db.Donations.SumAsync(d => d.Amount ?? d.EstimatedValue ?? 0);
    var supporterCount = await _db.Supporters.CountAsync();
    var postCount = await _db.SocialMediaPosts.CountAsync();

    sb.AppendLine($"SUMMARY: {residentCount} total residents ({activeResidents} active), {safehouseCount} safehouses, {donationCount} donations (₱{totalDonations:N0} total), {supporterCount} supporters, {postCount} social media posts.");

    // Conditionally load detailed data based on what the user is asking about
    if (ContainsAny(lower, "resident", "caseload", "girl", "case", "reintegration", "safehouse"))
    {
        var residents = await _db.Residents
            .Select(r => new { r.ResidentId, r.CaseStatus, r.CaseCategory, r.CurrentRiskLevel, r.ReintegrationStatus, r.SafehouseId, r.PresentAge })
            .Take(100).ToListAsync();
        sb.AppendLine($"RESIDENTS (sample): {System.Text.Json.JsonSerializer.Serialize(residents)}");
    }

    if (ContainsAny(lower, "donor", "donation", "supporter", "contribut", "campaign", "fundrais"))
    {
        var topDonors = await _db.Donations
            .Include(d => d.Supporter)
            .GroupBy(d => d.Supporter.DisplayName)
            .Select(g => new { Donor = g.Key, Total = g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0), Count = g.Count() })
            .OrderByDescending(x => x.Total)
            .Take(10).ToListAsync();
        sb.AppendLine($"TOP DONORS: {System.Text.Json.JsonSerializer.Serialize(topDonors)}");
    }

    if (ContainsAny(lower, "social", "post", "engagement", "platform", "facebook", "instagram", "tiktok"))
    {
        var platformStats = await _db.SocialMediaPosts
            .GroupBy(p => p.Platform)
            .Select(g => new { Platform = g.Key, Posts = g.Count(), AvgEngagement = g.Average(p => p.EngagementRate ?? 0) })
            .ToListAsync();
        sb.AppendLine($"SOCIAL MEDIA BY PLATFORM: {System.Text.Json.JsonSerializer.Serialize(platformStats)}");
    }

    if (ContainsAny(lower, "health", "wellbeing", "education", "progress"))
    {
        var avgHealth = await _db.HealthWellbeingRecords.AverageAsync(h => h.GeneralHealthScore ?? 0);
        var avgEdu = await _db.EducationRecords.AverageAsync(e => e.ProgressPercent ?? 0);
        sb.AppendLine($"HEALTH avg score: {avgHealth:F1}/5.0, EDUCATION avg progress: {avgEdu:F1}%");
    }

    if (ContainsAny(lower, "incident", "safety", "behavior"))
    {
        var incidents = await _db.IncidentReports
            .GroupBy(i => i.IncidentType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync();
        sb.AppendLine($"INCIDENTS BY TYPE: {System.Text.Json.JsonSerializer.Serialize(incidents)}");
    }

    return sb.ToString();
}

private static bool ContainsAny(string text, params string[] keywords)
    => keywords.Any(k => text.Contains(k));
```

#### `BuildSystemPrompt` — Tells Gemini how to respond

```csharp
private string BuildSystemPrompt(string dbContext)
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
```

#### `BuildContents` — Formats conversation history for Gemini

```csharp
private List<object> BuildContents(string systemPrompt, ChatRequest request)
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
```

#### `ParseGeminiResponse` — Extracts blocks from Gemini's JSON response

```csharp
private List<ChatBlock> ParseGeminiResponse(string responseJson)
{
    try
    {
        using var doc = JsonDocument.Parse(responseJson);
        var candidates = doc.RootElement.GetProperty("candidates");
        var content = candidates[0].GetProperty("content");
        var parts = content.GetProperty("parts");
        var text = parts[0].GetProperty("text").GetString() ?? "";

        // Gemini should return a JSON array of blocks
        // Try to parse as JSON array first
        var blocks = new List<ChatBlock>();

        // Clean up the text — Gemini sometimes wraps in markdown code blocks
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
                                elem.TryGetProperty("trend", out var t) ? t.GetString() : null,
                                elem.TryGetProperty("icon", out var ic) ? ic.GetString() : null));
                            break;
                        case "table":
                            var headers = elem.GetProperty("headers").EnumerateArray()
                                .Select(h => h.GetString() ?? "").ToList();
                            var rows = elem.GetProperty("rows").EnumerateArray()
                                .Select(r => r.EnumerateArray().Select(c => c.GetString() ?? "").ToList())
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
            // If JSON parsing fails, wrap entire response as text
            blocks.Add(new TextBlock(text));
        }

        if (blocks.Count == 0)
            blocks.Add(new TextBlock(text));

        return blocks;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to parse Gemini response");
        return new List<ChatBlock> { new TextBlock("Sorry, I had trouble processing that request. Please try again.") };
    }
}
```

### 4. Controller — `backend/Controllers/ChatController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/chat")]
[Authorize(Roles = "Admin,Staff")]
public class ChatController : ControllerBase
{
    private readonly IChatService _service;

    public ChatController(IChatService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<ChatResponse>> SendMessage([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Message is required." });

        var response = await _service.SendMessageAsync(request);
        return Ok(response);
    }
}
```

### 5. Register in Program.cs

Add to the service registration section in `backend/Program.cs`:

```csharp
builder.Services.AddHttpClient<IChatService, ChatService>();
```

---

## Frontend Implementation

### 1. New Hook — `frontend/src/hooks/useChat.ts`

```typescript
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatHistoryItem[];
}

interface ChatBlock {
  type: "text" | "stat" | "table" | "list";
  content?: string;
  label?: string;
  value?: string;
  trend?: string | null;
  icon?: string | null;
  title?: string;
  headers?: string[];
  rows?: string[][];
  items?: string[];
}

interface ChatResponse {
  blocks: ChatBlock[];
}

export type { ChatBlock, ChatResponse, ChatRequest, ChatHistoryItem };

export function useSendMessage() {
  return useMutation({
    mutationFn: (data: ChatRequest) =>
      api.post<ChatResponse>("/admin/chat", data),
  });
}
```

### 2. New Page — `frontend/src/pages/admin/ChatPage.tsx`

This is the main page. The layout should be:

```
┌──────────────────────────────────────┐
│  PageHeader: "Pharos AI" / "Ask..."  │
├──────────────────────────────────────┤
│                                      │
│  [Welcome card with suggested        │
│   questions when no messages yet]    │
│                                      │
│  ┌─ User Message ──────────────────┐ │
│  │ How many active residents...?   │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ AI Response ───────────────────┐ │
│  │ ┌──────┐ ┌──────┐ ┌──────┐     │ │
│  │ │ 42   │ │  9   │ │  3   │     │ │  ← StatBlock cards
│  │ │Active│ │Houses│ │Region│     │ │
│  │ └──────┘ └──────┘ └──────┘     │ │
│  │                                 │ │
│  │ Here's a breakdown by safe...   │ │  ← TextBlock paragraph
│  │                                 │ │
│  │ ┌─ Safehouse Overview ────────┐ │ │
│  │ │ Name    │ Active │ Capacity │ │ │  ← TableBlock
│  │ │ Hope    │   8    │   12     │ │ │
│  │ │ Light   │   6    │   10     │ │ │
│  │ └────────────────────────────┘ │ │
│  └─────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│ [💬 Ask a question...         ] [⏎] │  ← Input bar (sticky bottom)
└──────────────────────────────────────┘
```

**Key UI components within the page:**

#### Message Bubbles
- User messages: right-aligned, primary background, white text
- AI messages: left-aligned, card background, contains rendered blocks

#### Block Renderers
For each block type, render a distinct UI component:

- **TextBlock**: Regular paragraph with `text-sm leading-relaxed`
- **StatBlock**: Inline card with large bold value, small label, optional trend arrow (up=green, down=red). Use grid layout when multiple stat blocks appear consecutively.
- **TableBlock**: A clean mini table using `<table>` with striped rows, or a shadcn `Table` component. Title above.
- **ListBlock**: Bulleted list with title, using `<ul>` with custom list styling.

#### Welcome State (no messages)
Show a card with:
- Sparkle icon + "Pharos AI Assistant"
- "I can help you understand your organization's data. Try asking:"
- Grid of suggested question chips (clickable):
  - "How many active residents do we have?"
  - "Show me donation trends this year"
  - "Which safehouse has the most incidents?"
  - "What's our social media engagement like?"
  - "Compare education progress across safehouses"

Clicking a chip auto-sends that message.

#### Loading State
While waiting for Gemini response, show:
- A pulsing "thinking" indicator in the AI message area
- 3 animated dots or a shimmer skeleton

#### Input Bar
- Sticky at the bottom of the page
- Text input with placeholder "Ask about residents, donations, social media..."
- Send button (arrow icon) that's disabled when input is empty or loading
- Submit on Enter key press
- Clear input after send

### 3. State Management

Use `useState` for conversation history (not persisted to DB):

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string;
  blocks?: ChatBlock[];
  timestamp: Date;
}

const [messages, setMessages] = useState<Message[]>([]);
```

When user sends a message:
1. Add user message to `messages` state
2. Call `useSendMessage` mutation with message + history
3. On success, add assistant message with `blocks` from response
4. History sent to backend is a flat array of `{ role, content }` from previous messages (for text blocks, join their content)

### 4. Route + Navigation

**`frontend/src/App.tsx`** — Add:
```typescript
const ChatPage = lazy(() => import("@/pages/admin/ChatPage"));
// In admin routes:
<Route path="/admin/chat" element={<ChatPage />} />
```

**`frontend/src/components/layout/AdminLayout.tsx`** — Add nav item. Put it in the "Overview" group or create a new group:

```typescript
// In navGroups, add to Overview or as its own group:
{ label: "Pharos AI", href: "/admin/chat", icon: Sparkles }
```

Import `Sparkles` from lucide-react (already imported in AdminLayout for other purposes — check first).

---

## Design Specifications

Follow the project's design system from `CLAUDE.md`:

- **Card backgrounds** for AI responses: Use `bg-card` with subtle border
- **Stat blocks**: Use the same style as `StatCard` component — tabular-nums, bold, text-3xl for value
- **Tables**: Match the `DataTableWrapper` style but simpler (no pagination needed for small inline tables)
- **Animations**: Fade-in for new messages using Motion. Stagger blocks within an AI response.
- **Typography**: Messages use Inter font. Code or data values use tabular-nums.
- **Colors**: User messages use `bg-primary text-primary-foreground`. AI messages use `bg-card`.
- **Dark mode**: All elements must respect dark/light mode via CSS variables.

---

## Files to Create

| File | Purpose |
|---|---|
| `backend/DTOs/ChatDtos.cs` | Chat request/response DTOs with polymorphic block types |
| `backend/Services/ChatService.cs` | IChatService + ChatService — orchestrates DB queries + Gemini call |
| `backend/Controllers/ChatController.cs` | POST /api/admin/chat endpoint |
| `frontend/src/hooks/useChat.ts` | React Query mutation for sending messages |
| `frontend/src/pages/admin/ChatPage.tsx` | Full chat page with rich block rendering |

## Files to Modify

| File | Changes |
|---|---|
| `backend/Program.cs` | Register `IChatService` / `ChatService` with `AddHttpClient` |
| `frontend/src/App.tsx` | Add lazy import + route for ChatPage |
| `frontend/src/components/layout/AdminLayout.tsx` | Add "Pharos AI" nav item with Sparkles icon |

---

## Checklist

- [ ] Create `ChatDtos.cs` with polymorphic block types and JSON serialization attributes
- [ ] Create `ChatService.cs` with DB context querying and Gemini API integration
- [ ] Create `ChatController.cs` with POST endpoint
- [ ] Register ChatService in `Program.cs`
- [ ] Create `useChat.ts` hook
- [ ] Create `ChatPage.tsx` with full UI: welcome state, messages, block renderers, input bar
- [ ] Add route in `App.tsx`
- [ ] Add sidebar nav item in `AdminLayout.tsx`
- [ ] Verify block rendering: text, stat, table, list
- [ ] Verify loading state and error handling
- [ ] Verify dark/light mode
- [ ] Verify backend and frontend build cleanly
