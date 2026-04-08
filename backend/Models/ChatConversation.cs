namespace Pharos.Api.Models;

public class ChatConversation
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Title { get; set; } = "New Chat";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<ChatMessage> Messages { get; set; } = [];
}

public class ChatMessage
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public string Role { get; set; } = "user";
    public string ContentJson { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ChatConversation? Conversation { get; set; }
}
