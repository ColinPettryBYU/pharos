using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;
using Pharos.Api.Services.PlatformClients;

namespace Pharos.Api.Services;

public class SocialMediaService : ISocialMediaService
{
    private readonly PharosDbContext _db;
    private readonly IPlatformClientFactory _clientFactory;
    private readonly ITokenEncryptionService _tokenService;
    private readonly ILogger<SocialMediaService> _logger;

    public SocialMediaService(
        PharosDbContext db,
        IPlatformClientFactory clientFactory,
        ITokenEncryptionService tokenService,
        ILogger<SocialMediaService> logger)
    {
        _db = db;
        _clientFactory = clientFactory;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<PagedResult<SocialMediaPostDto>> GetPostsAsync(int page, int pageSize, string? platform, string? postType, string? contentTopic, string? search)
    {
        var query = _db.SocialMediaPosts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(platform)) query = query.Where(p => p.Platform == platform);
        if (!string.IsNullOrWhiteSpace(postType)) query = query.Where(p => p.PostType == postType);
        if (!string.IsNullOrWhiteSpace(contentTopic)) query = query.Where(p => p.ContentTopic == contentTopic);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(p => p.Caption != null && p.Caption.Contains(search));

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new SocialMediaPostDto(
                p.PostId, p.Platform, p.PlatformPostId, p.PostUrl, p.CreatedAt,
                p.DayOfWeek, p.PostHour, p.PostType, p.MediaType, p.Caption,
                p.Hashtags, p.NumHashtags, p.MentionsCount, p.HasCallToAction,
                p.CallToActionType, p.ContentTopic, p.SentimentTone, p.CaptionLength,
                p.FeaturesResidentStory, p.CampaignName, p.IsBoosted, p.BoostBudgetPhp,
                p.Impressions, p.Reach, p.Likes, p.Comments, p.Shares, p.Saves,
                p.ClickThroughs, p.VideoViews, p.EngagementRate, p.ProfileVisits,
                p.DonationReferrals, p.EstimatedDonationValuePhp, p.FollowerCountAtPost,
                p.WatchTimeSeconds, p.AvgViewDurationSeconds, p.SubscriberCountAtPost, p.Forwards))
            .ToListAsync();

        return new PagedResult<SocialMediaPostDto>(items, totalCount, page, pageSize, totalPages);
    }

    public async Task<SocialMediaAnalyticsDto> GetAnalyticsAsync(DateTime? from, DateTime? to, string? platform)
    {
        var query = _db.SocialMediaPosts.AsQueryable();
        if (from.HasValue) query = query.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(p => p.CreatedAt <= to.Value);
        if (!string.IsNullOrWhiteSpace(platform)) query = query.Where(p => p.Platform == platform);

        var posts = await query.ToListAsync();

        var byPlatform = posts.GroupBy(p => p.Platform).Select(g => new PlatformBreakdownDto(
            g.Key, g.Count(),
            g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
            g.Sum(p => p.DonationReferrals ?? 0))).ToList();

        var byTopic = posts.Where(p => p.ContentTopic != null).GroupBy(p => p.ContentTopic!).Select(g => new ContentTopicBreakdownDto(
            g.Key, g.Count(),
            g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
            g.Sum(p => p.DonationReferrals ?? 0))).ToList();

        var byPostType = posts.GroupBy(p => p.PostType).Select(g => new PostTypeBreakdownDto(
            g.Key, g.Count(),
            g.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average())).ToList();

        return new SocialMediaAnalyticsDto(
            posts.Count,
            posts.Where(p => p.EngagementRate.HasValue).Select(p => p.EngagementRate!.Value).DefaultIfEmpty(0).Average(),
            posts.Sum(p => p.DonationReferrals ?? 0),
            posts.Sum(p => p.EstimatedDonationValuePhp ?? 0),
            byPlatform, byTopic, byPostType);
    }

    public async Task<ComposeResultDto> ComposePostAsync(ComposePostRequest request)
    {
        var connectedAccounts = await _db.SocialMediaAccounts
            .Where(a => a.Status == "Active")
            .ToListAsync();

        var postTime = request.ScheduledTime ?? DateTime.UtcNow;
        var results = new List<SocialMediaPostDto>();
        var errors = new List<string>();

        foreach (var platform in request.Platforms)
        {
            var account = connectedAccounts.FirstOrDefault(
                a => a.Platform.Equals(platform, StringComparison.OrdinalIgnoreCase));

            string? platformPostId = null;
            string? postUrl = null;

            if (account == null)
            {
                errors.Add($"{platform}: No connected account found. Connect it in Social Accounts settings first.");
                continue;
            }

            var client = _clientFactory.GetClient(platform);
            if (client == null)
            {
                errors.Add($"{platform}: Platform not supported.");
                continue;
            }

            var postResult = request.ScheduledTime.HasValue
                ? await client.SchedulePostAsync(account, request)
                : await client.PublishPostAsync(account, request);

            if (postResult.Success)
            {
                platformPostId = postResult.PlatformPostId;
                postUrl = postResult.PostUrl;
                _logger.LogInformation("Published to {Platform}: {PostId}", platform, platformPostId);
            }
            else
            {
                errors.Add($"{platform}: {postResult.Error}");
                _logger.LogWarning("Failed to publish to {Platform}: {Error}", platform, postResult.Error);
                continue;
            }

            var entity = new SocialMediaPost
            {
                Platform = platform,
                PlatformPostId = platformPostId,
                PostUrl = postUrl,
                PostType = request.PostType,
                MediaType = request.MediaType,
                Caption = request.Caption,
                Hashtags = request.Hashtags,
                NumHashtags = request.Hashtags?.Split(',').Length ?? 0,
                HasCallToAction = !string.IsNullOrWhiteSpace(request.CallToActionType),
                CallToActionType = request.CallToActionType,
                ContentTopic = request.ContentTopic,
                SentimentTone = request.SentimentTone,
                CaptionLength = request.Caption?.Length ?? 0,
                CampaignName = request.CampaignName,
                IsBoosted = request.IsBoosted,
                BoostBudgetPhp = request.BoostBudgetPhp,
                CreatedAt = postTime,
                DayOfWeek = postTime.DayOfWeek.ToString(),
                PostHour = postTime.Hour
            };

            _db.SocialMediaPosts.Add(entity);
            await _db.SaveChangesAsync();

            results.Add(new SocialMediaPostDto(
                entity.PostId, entity.Platform, entity.PlatformPostId, entity.PostUrl,
                entity.CreatedAt, entity.DayOfWeek, entity.PostHour, entity.PostType,
                entity.MediaType, entity.Caption, entity.Hashtags, entity.NumHashtags,
                entity.MentionsCount, entity.HasCallToAction, entity.CallToActionType,
                entity.ContentTopic, entity.SentimentTone, entity.CaptionLength,
                entity.FeaturesResidentStory, entity.CampaignName, entity.IsBoosted,
                entity.BoostBudgetPhp, entity.Impressions, entity.Reach, entity.Likes,
                entity.Comments, entity.Shares, entity.Saves, entity.ClickThroughs,
                entity.VideoViews, entity.EngagementRate, entity.ProfileVisits,
                entity.DonationReferrals, entity.EstimatedDonationValuePhp,
                entity.FollowerCountAtPost, entity.WatchTimeSeconds,
                entity.AvgViewDurationSeconds, entity.SubscriberCountAtPost, entity.Forwards));
        }

        return new ComposeResultDto(results, errors.Count > 0 ? errors : null);
    }

    public async Task<CommentInboxResponse> GetCommentInboxAsync(string? platform, int page, int pageSize)
    {
        var accounts = await _db.SocialMediaAccounts
            .Where(a => a.Status == "Active")
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(platform))
            accounts = accounts.Where(a => a.Platform.Equals(platform, StringComparison.OrdinalIgnoreCase)).ToList();

        var recentPosts = await _db.SocialMediaPosts
            .Where(p => p.PlatformPostId != null
                && (!string.IsNullOrWhiteSpace(platform)
                    ? p.Platform.ToLower() == platform!.ToLower()
                    : true))
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .ToListAsync();

        var postIdsByPlatform = recentPosts
            .GroupBy(p => p.Platform, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Select(p => p.PlatformPostId!).ToList(),
                StringComparer.OrdinalIgnoreCase);

        var allComments = new List<CommentInboxDto>();
        var fetchTasks = new List<Task<List<CommentDto>>>();

        foreach (var account in accounts)
        {
            var client = _clientFactory.GetClient(account.Platform);
            if (client == null) continue;

            if (client is InstagramClient igClient
                && postIdsByPlatform.TryGetValue(account.Platform, out var igPostIds)
                && igPostIds.Count > 0)
            {
                fetchTasks.Add(igClient.GetCommentsForPostsAsync(account, igPostIds));
            }
            else
            {
                fetchTasks.Add(client.GetCommentsAsync(account));
            }
        }

        var results = await Task.WhenAll(fetchTasks);
        foreach (var commentList in results)
        {
            allComments.AddRange(commentList.Select(c => new CommentInboxDto(
                c.CommentId, c.Platform, c.PostId, c.CommenterName,
                c.CommentText, c.CreatedAt, c.IsRead, c.PostThumbnail)));
        }

        var sorted = allComments.OrderByDescending(c => c.CreatedAt).ToList();
        var paged = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new CommentInboxResponse(paged, sorted.Count, page, pageSize);
    }

    public async Task<bool> ReplyToCommentAsync(string platform, string commentId, string message)
    {
        var account = await _db.SocialMediaAccounts
            .FirstOrDefaultAsync(a => a.Platform.ToLower() == platform.ToLower() && a.Status == "Active");

        if (account == null)
        {
            _logger.LogWarning("No active {Platform} account for reply", platform);
            return false;
        }

        var client = _clientFactory.GetClient(platform);
        if (client == null)
        {
            _logger.LogWarning("No platform client for {Platform}", platform);
            return false;
        }

        return await client.ReplyToCommentAsync(account, commentId, message);
    }
}
