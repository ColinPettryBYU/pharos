namespace Pharos.Api.DTOs;

public record SocialMediaPostDto(
    int PostId,
    string Platform,
    string? PlatformPostId,
    string? PostUrl,
    DateTime CreatedAt,
    string? DayOfWeek,
    int? PostHour,
    string PostType,
    string? MediaType,
    string? Caption,
    string? Hashtags,
    int NumHashtags,
    int MentionsCount,
    bool HasCallToAction,
    string? CallToActionType,
    string? ContentTopic,
    string? SentimentTone,
    int? CaptionLength,
    bool FeaturesResidentStory,
    string? CampaignName,
    bool IsBoosted,
    decimal? BoostBudgetPhp,
    int? Impressions,
    int? Reach,
    int? Likes,
    int? Comments,
    int? Shares,
    int? Saves,
    int? ClickThroughs,
    int? VideoViews,
    decimal? EngagementRate,
    int? ProfileVisits,
    int? DonationReferrals,
    decimal? EstimatedDonationValuePhp,
    int? FollowerCountAtPost,
    decimal? WatchTimeSeconds,
    decimal? AvgViewDurationSeconds,
    int? SubscriberCountAtPost,
    decimal? Forwards
);

public record SocialMediaAnalyticsDto(
    int TotalPosts,
    decimal AvgEngagementRate,
    int TotalDonationReferrals,
    decimal TotalEstimatedDonationValue,
    IEnumerable<PlatformBreakdownDto> ByPlatform,
    IEnumerable<ContentTopicBreakdownDto> ByContentTopic,
    IEnumerable<PostTypeBreakdownDto> ByPostType
);

public record PlatformBreakdownDto(
    string Platform,
    int PostCount,
    decimal AvgEngagementRate,
    int TotalDonationReferrals
);

public record ContentTopicBreakdownDto(
    string ContentTopic,
    int PostCount,
    decimal AvgEngagementRate,
    int TotalDonationReferrals
);

public record PostTypeBreakdownDto(
    string PostType,
    int PostCount,
    decimal AvgEngagementRate
);

public record ComposePostRequest(
    List<string> Platforms,
    string PostType,
    string? MediaType,
    string Caption,
    string? Hashtags,
    string? CallToActionType,
    string? ContentTopic,
    string? SentimentTone,
    string? CampaignName,
    bool IsBoosted,
    decimal? BoostBudgetPhp,
    DateTime? ScheduledTime
);

public record CommentReplyRequest(
    string ReplyText
);

public record ConnectedAccountDto(
    int Id,
    string Platform,
    string AccountName,
    string? AccountId,
    DateTime ConnectedAt,
    DateTime? TokenExpiresAt,
    string Status
);

public record OAuthInitiateResponse(
    string RedirectUrl
);

public record CommentInboxDto(
    string CommentId,
    string Platform,
    string? PostId,
    string CommenterName,
    string CommentText,
    DateTime CreatedAt,
    bool IsRead,
    string? PostThumbnail = null
);

public record CommentInboxResponse(
    List<CommentInboxDto> Comments,
    int TotalCount,
    int Page,
    int PageSize
);

public record ComposePostResponse(
    List<PlatformPostResult> Results,
    bool AllSucceeded
);

public record PlatformPostResult(
    string Platform,
    bool Success,
    string? PlatformPostId,
    string? PostUrl,
    string? Error
);
