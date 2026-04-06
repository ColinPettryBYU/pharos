using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pharos.Api.DTOs;
using Pharos.Api.Services;

namespace Pharos.Api.Controllers;

[ApiController]
[Route("api/admin/social-media")]
[Authorize(Roles = "Admin")]
public class SocialMediaController : ControllerBase
{
    private readonly ISocialMediaService _service;

    public SocialMediaController(ISocialMediaService service) => _service = service;

    [HttpGet("posts")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<PagedResult<SocialMediaPostDto>>> GetPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? platform = null,
        [FromQuery] string? postType = null,
        [FromQuery] string? contentTopic = null,
        [FromQuery] string? search = null)
    {
        var result = await _service.GetPostsAsync(page, pageSize, platform, postType, contentTopic, search);
        return Ok(result);
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<ActionResult<SocialMediaAnalyticsDto>> GetAnalytics(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? platform = null)
    {
        var result = await _service.GetAnalyticsAsync(from, to, platform);
        return Ok(result);
    }

    [HttpPost("compose")]
    public async Task<ActionResult<SocialMediaPostDto>> Compose([FromBody] ComposePostRequest request)
    {
        var result = await _service.ComposePostAsync(request);
        return Ok(result);
    }

    [HttpPost("comments/{id}/reply")]
    public IActionResult ReplyToComment(int id, [FromBody] CommentReplyRequest request)
    {
        // Placeholder: actual social media API integration would go here
        return Ok(new { message = $"Reply queued for comment {id}.", replyText = request.ReplyText });
    }

    [HttpGet("comments/inbox")]
    public IActionResult GetCommentInbox()
    {
        // Placeholder: would aggregate comments from all connected social media platforms
        return Ok(new { message = "Comment inbox - integration pending.", comments = Array.Empty<object>() });
    }
}
