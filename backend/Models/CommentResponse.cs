namespace Pharos.Api.Models;

public class CommentResponse
{
    public int Id { get; set; }
    public string CommentId { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string ReplyText { get; set; } = string.Empty;
    public DateTime RespondedAt { get; set; }
}
