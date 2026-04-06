namespace Pharos.Api.Models;

public class PublicImpactSnapshot
{
    public int SnapshotId { get; set; }
    public DateTime SnapshotDate { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string? SummaryText { get; set; }
    public string? MetricPayloadJson { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
}
