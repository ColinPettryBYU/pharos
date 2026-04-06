using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.DTOs;
using Pharos.Api.Models;

namespace Pharos.Api.Services;

public class SocialMediaService : ISocialMediaService
{
    private readonly PharosDbContext _db;

    public SocialMediaService(PharosDbContext db) => _db = db;

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

    public async Task<SocialMediaPostDto> ComposePostAsync(ComposePostRequest request)
    {
        var entity = new SocialMediaPost
        {
            Platform = request.Platform,
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
            CreatedAt = DateTime.UtcNow,
            DayOfWeek = DateTime.UtcNow.DayOfWeek.ToString()
        };

        _db.SocialMediaPosts.Add(entity);
        await _db.SaveChangesAsync();

        return new SocialMediaPostDto(
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
            entity.AvgViewDurationSeconds, entity.SubscriberCountAtPost, entity.Forwards);
    }
}
