using System.Text.Json.Serialization;

namespace Pharos.Api.DTOs;

public record ChatRequest(
    string Message,
    List<ChatHistoryItem>? History
);

public record ChatHistoryItem(
    string Role,
    string Content
);

public record ChatResponse(
    List<ChatBlock> Blocks
);

[JsonDerivedType(typeof(TextBlock), "text")]
[JsonDerivedType(typeof(StatBlock), "stat")]
[JsonDerivedType(typeof(TableBlock), "table")]
[JsonDerivedType(typeof(ListBlock), "list")]
[JsonDerivedType(typeof(ChartBlock), "chart")]
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

public record ChartBlock(
    string ChartType,
    string? Title,
    string? XKey,
    List<string>? YKeys,
    List<Dictionary<string, object>>? Data,
    List<string>? Colors
) : ChatBlock("chart");
