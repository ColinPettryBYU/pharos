using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/chat")]
[Authorize(Roles = "Admin,Staff")]
public class ChatController : ControllerBase
{
    private readonly IChatService _service;
    private readonly PharosDbContext _db;
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

    public ChatController(IChatService service, PharosDbContext db)
    {
        _service = service;
        _db = db;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    [HttpGet("conversations")]
    public async Task<ActionResult> GetConversations()
    {
        var userId = GetUserId();
        var conversations = await _db.ChatConversations
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new { c.Id, c.Title, c.CreatedAt, c.UpdatedAt, MessageCount = c.Messages.Count })
            .ToListAsync();
        return Ok(conversations);
    }

    [HttpPost("conversations")]
    public async Task<ActionResult> CreateConversation()
    {
        var conversation = new ChatConversation
        {
            UserId = GetUserId(),
            Title = "New Chat",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.ChatConversations.Add(conversation);
        await _db.SaveChangesAsync();
        return Ok(new { conversation.Id, conversation.Title, conversation.CreatedAt, conversation.UpdatedAt });
    }

    [HttpDelete("conversations/{id}")]
    public async Task<ActionResult> DeleteConversation(int id)
    {
        var conversation = await _db.ChatConversations.FirstOrDefaultAsync(c => c.Id == id && c.UserId == GetUserId());
        if (conversation == null) return NotFound();
        _db.ChatConversations.Remove(conversation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("conversations/{id}/messages")]
    public async Task<ActionResult> GetMessages(int id)
    {
        var userId = GetUserId();
        var conversation = await _db.ChatConversations.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (conversation == null) return NotFound();

        var messages = await _db.ChatMessages
            .Where(m => m.ConversationId == id)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new { m.Id, m.Role, m.ContentJson, m.CreatedAt })
            .ToListAsync();
        return Ok(new { conversation = new { conversation.Id, conversation.Title }, messages });
    }

    [HttpPost]
    public async Task<ActionResult<ChatResponse>> SendMessage([FromBody] ChatSendRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Message is required." });

        var userId = GetUserId();

        ChatConversation? conversation = null;
        if (request.ConversationId.HasValue)
        {
            conversation = await _db.ChatConversations.FirstOrDefaultAsync(c => c.Id == request.ConversationId && c.UserId == userId);
        }

        if (conversation == null)
        {
            conversation = new ChatConversation
            {
                UserId = userId,
                Title = request.Message.Length > 60 ? request.Message[..60] + "..." : request.Message,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _db.ChatConversations.Add(conversation);
            await _db.SaveChangesAsync();
        }

        _db.ChatMessages.Add(new ChatMessage
        {
            ConversationId = conversation.Id,
            Role = "user",
            ContentJson = JsonSerializer.Serialize(new { text = request.Message }, _jsonOpts),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var chatRequest = new ChatRequest(request.Message, request.History);
        var response = await _service.SendMessageAsync(chatRequest, userId);

        _db.ChatMessages.Add(new ChatMessage
        {
            ConversationId = conversation.Id,
            Role = "assistant",
            ContentJson = JsonSerializer.Serialize(response.Blocks, _jsonOpts),
            CreatedAt = DateTime.UtcNow,
        });

        conversation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { conversation_id = conversation.Id, conversation_title = conversation.Title, blocks = response.Blocks });
    }
}

public record ChatSendRequest(
    string Message,
    int? ConversationId,
    List<ChatHistoryItem>? History
);
