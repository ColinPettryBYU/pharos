# Social Media Agent — Pharos

> Reference `CLAUDE.md` for project context and `agents/frontend-agent.md` for UI specs.

You are responsible for integrating social media platform APIs into Pharos. This is the standout feature — a Social Media Command Center where staff can compose posts, view analytics, and manage comments across multiple platforms from one unified interface.

---

## Platform Integration Tiers

### Tier 1 — Full Integration (compose, schedule, analytics, comments)
| Platform | API | Key Permissions |
|---|---|---|
| **Facebook** | Graph API v25 | `pages_manage_posts`, `pages_read_engagement`, `pages_manage_metadata` |
| **Instagram** | Instagram Graph API (via Meta) | `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights` |
| **LinkedIn** | Community Management API | Posts API, Comments API, Social Metadata API |
| **YouTube** | Data API v3 | `youtube.upload`, `youtube.force-ssl` (for comments) |

### Tier 2 — Publish + Analytics (no comment management from app)
| Platform | API | Key Permissions |
|---|---|---|
| **TikTok** | Content Posting API | `video.publish`, `video.upload` |
| **Twitter/X** | API v2 | Post tweets, read engagement |

### Tier 3 — Display Only (show historical data from DB, link out)
| Platform | Notes |
|---|---|
| **WhatsApp** | Business API is messaging-first, not post/comment. Show metrics from CSV data, link to WhatsApp Channel |

---

## Architecture

```
Frontend (React)
  └── Social Media Command Center UI
        ├── Compose Panel → POST /api/admin/social-media/compose
        ├── Analytics Panel → GET /api/admin/social-media/analytics
        └── Comments Panel → GET /api/admin/social-media/comments/inbox
                             POST /api/admin/social-media/comments/:id/reply

Backend (.NET)
  └── SocialMediaController
        └── ISocialMediaService
              ├── FacebookService (Graph API client)
              ├── InstagramService (Graph API client — same Meta ecosystem)
              ├── LinkedInService (REST client)
              ├── YouTubeService (Google API client)
              ├── TikTokService (REST client)
              ├── TwitterService (REST client)
              └── SocialMediaPostRepository (local DB for tracking)
```

---

## OAuth Flows

All social media APIs require OAuth 2.0. The org authenticates ONCE to connect their accounts, and the app stores access/refresh tokens securely.

### Facebook + Instagram (Meta Ecosystem)
```
1. Admin clicks "Connect Facebook/Instagram" in settings
2. Redirect to: https://www.facebook.com/v25.0/dialog/oauth
   ?client_id={APP_ID}
   &redirect_uri={CALLBACK_URL}
   &scope=pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights
3. User authorizes → callback receives code
4. Exchange code for access token: POST https://graph.facebook.com/v25.0/oauth/access_token
5. Get Page access token (long-lived): GET /me/accounts
6. Store Page access token + Page ID securely
7. For Instagram: GET /{page_id}?fields=instagram_business_account → get IG account ID
```

**Token Storage**: Store encrypted in database or Azure Key Vault. NEVER in source code.

**Token Refresh**: Facebook Page tokens don't expire if obtained from a long-lived user token. Instagram tokens last 60 days — implement auto-refresh.

### LinkedIn
```
1. Redirect to: https://www.linkedin.com/oauth/v2/authorization
   ?response_type=code
   &client_id={CLIENT_ID}
   &redirect_uri={CALLBACK_URL}
   &scope=r_organization_social,w_organization_social,rw_organization_admin
2. Exchange code for access token
3. Get organization URN: GET /organizationAcls
4. Store access token + org URN
```
Tokens expire in 60 days. Implement refresh with `refresh_token`.

### YouTube
```
1. Use Google OAuth 2.0 (same as Google login but with additional scopes)
2. Scopes: youtube.upload, youtube.force-ssl, youtube.readonly
3. Exchange code for access token + refresh token
4. Store channel ID + tokens
```

### TikTok
```
1. Redirect to: https://www.tiktok.com/v2/auth/authorize/
   ?client_key={CLIENT_KEY}
   &scope=video.publish,video.upload
   &response_type=code
   &redirect_uri={CALLBACK_URL}
2. Exchange code for access token
3. Store access token (expires in 24hrs — must use refresh_token)
```

### Twitter/X
```
1. OAuth 2.0 with PKCE
2. Scopes: tweet.write, tweet.read, users.read
3. Exchange code for access token
4. Pay-per-use: ~$0.01/tweet
```

---

## Backend Service Layer

### ISocialMediaService Interface
```csharp
public interface ISocialMediaService
{
    // Compose & publish
    Task<PostResult> PublishPostAsync(ComposePostRequest request);
    Task<PostResult> SchedulePostAsync(ComposePostRequest request, DateTime scheduledTime);
    
    // Analytics
    Task<SocialAnalyticsDto> GetAnalyticsAsync(string? platform, DateTime startDate, DateTime endDate);
    Task<IEnumerable<PostPerformanceDto>> GetTopPostsAsync(string? platform, int count = 10);
    Task<PostingHeatmapDto> GetPostingHeatmapAsync();
    
    // Comments (Tier 1 platforms only)
    Task<IEnumerable<CommentDto>> GetCommentsInboxAsync(string? platform, int page, int pageSize);
    Task<CommentReplyResult> ReplyToCommentAsync(string platform, string commentId, string message);
    Task HideCommentAsync(string platform, string commentId);
    Task DeleteCommentAsync(string platform, string commentId);
    
    // Account connection
    Task<OAuthRedirectResult> InitiateConnectionAsync(string platform);
    Task CompleteConnectionAsync(string platform, string code, string? state);
    Task<IEnumerable<ConnectedAccountDto>> GetConnectedAccountsAsync();
}
```

### ComposePostRequest
```csharp
public record ComposePostRequest(
    List<string> Platforms,         // Which platforms to post to
    string Caption,                 // Post text/caption
    string? MediaUrl,               // URL to media file (uploaded separately)
    string MediaType,               // Photo, Video, Carousel, Text, Reel
    List<string>? Hashtags,
    bool HasCallToAction,
    string? CallToActionType,       // DonateNow, LearnMore, ShareStory, SignUp
    string ContentTopic,
    string SentimentTone,
    string? CampaignName,
    DateTime? ScheduledTime         // null = post now
);
```

---

## Platform-Specific API Calls

### Facebook — Publish Post
```csharp
public async Task<PostResult> PublishToFacebook(ComposePostRequest request)
{
    var pageToken = await GetStoredToken("facebook");
    var pageId = await GetStoredPageId("facebook");
    
    // Text post
    var response = await _httpClient.PostAsync(
        $"https://graph.facebook.com/v25.0/{pageId}/feed",
        new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["message"] = request.Caption,
            ["access_token"] = pageToken
        })
    );
    
    // Photo post
    // POST /{page-id}/photos with source (image URL) + message
    
    // Video post
    // POST /{page-id}/videos with file_url + description
    
    // Scheduled post
    // Add published=false and scheduled_publish_time (UNIX timestamp)
    
    var result = await response.Content.ReadFromJsonAsync<FacebookPostResponse>();
    
    // Save to local DB for tracking
    await SavePostRecord("Facebook", result.Id, request);
    
    return new PostResult(true, "Facebook", result.Id);
}
```

### Facebook — Read & Reply to Comments
```csharp
public async Task<List<CommentDto>> GetFacebookComments(string postId)
{
    var pageToken = await GetStoredToken("facebook");
    var response = await _httpClient.GetAsync(
        $"https://graph.facebook.com/v25.0/{postId}/comments?access_token={pageToken}&fields=id,message,from,created_time"
    );
    var data = await response.Content.ReadFromJsonAsync<FacebookCommentsResponse>();
    return data.Data.Select(c => new CommentDto(
        Platform: "Facebook",
        CommentId: c.Id,
        AuthorName: c.From.Name,
        Message: c.Message,
        CreatedAt: c.CreatedTime,
        PostId: postId
    )).ToList();
}

public async Task ReplyToFacebookComment(string commentId, string message)
{
    var pageToken = await GetStoredToken("facebook");
    await _httpClient.PostAsync(
        $"https://graph.facebook.com/v25.0/{commentId}/comments",
        new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["message"] = message,
            ["access_token"] = pageToken
        })
    );
}
```

### Instagram — Publish Post
```csharp
public async Task<PostResult> PublishToInstagram(ComposePostRequest request)
{
    var token = await GetStoredToken("instagram");
    var igAccountId = await GetStoredAccountId("instagram");
    
    // Step 1: Create media container
    var containerResponse = await _httpClient.PostAsync(
        $"https://graph.instagram.com/v25.0/{igAccountId}/media",
        new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["image_url"] = request.MediaUrl!,  // Must be a public URL
            ["caption"] = BuildCaption(request), // Caption + hashtags
            ["access_token"] = token
        })
    );
    var container = await containerResponse.Content.ReadFromJsonAsync<IgContainerResponse>();
    
    // Step 2: Publish the container
    var publishResponse = await _httpClient.PostAsync(
        $"https://graph.instagram.com/v25.0/{igAccountId}/media_publish",
        new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["creation_id"] = container.Id,
            ["access_token"] = token
        })
    );
    
    var result = await publishResponse.Content.ReadFromJsonAsync<IgPublishResponse>();
    await SavePostRecord("Instagram", result.Id, request);
    return new PostResult(true, "Instagram", result.Id);
}
```

### Instagram — Comments
```csharp
// GET /{media-id}/comments?fields=id,text,username,timestamp
// POST /{comment-id}/replies with message field
```

### LinkedIn — Publish Post
```csharp
public async Task<PostResult> PublishToLinkedIn(ComposePostRequest request)
{
    var token = await GetStoredToken("linkedin");
    var orgUrn = await GetStoredOrgUrn();
    
    var postBody = new
    {
        author = orgUrn,
        commentary = request.Caption,
        visibility = "PUBLIC",
        distribution = new
        {
            feedDistribution = "MAIN_FEED",
            targetEntities = Array.Empty<object>(),
            thirdPartyDistributionChannels = Array.Empty<object>()
        },
        lifecycleState = "PUBLISHED"
    };
    
    var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.linkedin.com/rest/posts");
    httpRequest.Headers.Add("Authorization", $"Bearer {token}");
    httpRequest.Headers.Add("LinkedIn-Version", "202603");
    httpRequest.Content = JsonContent.Create(postBody);
    
    var response = await _httpClient.SendAsync(httpRequest);
    // LinkedIn returns post URN in x-restli-id header
    var postUrn = response.Headers.GetValues("x-restli-id").First();
    
    await SavePostRecord("LinkedIn", postUrn, request);
    return new PostResult(true, "LinkedIn", postUrn);
}
```

### YouTube — Upload Video
```csharp
// Use Google.Apis.YouTube.v3 NuGet package
// YouTubeService → Videos.Insert(video, "snippet,status", stream)
// Set snippet.Title, snippet.Description (caption), snippet.Tags (hashtags)
// Set status.PrivacyStatus = "public"
// For comments: CommentThreads.Insert / Comments.List
```

### TikTok — Publish
```csharp
// POST https://open.tiktokapis.com/v2/post/publish/video/init/
// Headers: Authorization: Bearer {token}, Content-Type: application/json
// Body: { "post_info": { "title": caption, "privacy_level": "PUBLIC_TO_EVERYONE" }, 
//         "source_info": { "source": "PULL_FROM_URL", "video_url": mediaUrl } }
// Then poll /v2/post/publish/status/fetch/ for completion
```

### Twitter/X — Post Tweet
```csharp
// POST https://api.twitter.com/2/tweets
// Headers: Authorization: Bearer {token}
// Body: { "text": caption }
// Note: Pay-per-use ~$0.01/tweet
```

---

## Unified Comments Inbox

The comments inbox aggregates comments from all Tier 1 platforms into one feed.

### Backend Approach
```csharp
public async Task<List<CommentDto>> GetUnifiedInbox(int page, int pageSize, string? platformFilter)
{
    var allComments = new List<CommentDto>();
    
    // Fetch from each connected Tier 1 platform in parallel
    var tasks = new List<Task<List<CommentDto>>>();
    
    if (platformFilter == null || platformFilter == "facebook")
        tasks.Add(GetFacebookRecentComments());
    if (platformFilter == null || platformFilter == "instagram")
        tasks.Add(GetInstagramRecentComments());
    if (platformFilter == null || platformFilter == "linkedin")
        tasks.Add(GetLinkedInRecentComments());
    if (platformFilter == null || platformFilter == "youtube")
        tasks.Add(GetYouTubeRecentComments());
    
    var results = await Task.WhenAll(tasks);
    allComments = results.SelectMany(r => r)
        .OrderByDescending(c => c.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToList();
    
    return allComments;
}
```

### Caching Strategy
- Cache comments for 5 minutes (avoid rate limits)
- Use React Query's `staleTime` on frontend
- Consider webhooks for real-time updates (Facebook and Instagram support them)

---

## Analytics Integration

### From Database (Historical)
The `social_media_posts` table already has rich engagement data from the CSV. Use this for:
- Historical trend analysis
- Platform comparison charts
- Content type effectiveness
- The Social → Donation correlation (via `donation_referrals` and `estimated_donation_value_php`)

### From Live APIs (Current)
For connected accounts, supplement with live data:
- Facebook: `/{post-id}?fields=insights.metric(post_impressions,post_engaged_users)` 
- Instagram: `/{media-id}/insights?metric=impressions,reach,engagement`
- LinkedIn: Social Metadata API for reactions/comments/shares
- YouTube: `videos.list` with `part=statistics`

### Analytics Endpoints
```csharp
[HttpGet("analytics")]
public async Task<ActionResult<SocialAnalyticsDto>> GetAnalytics(
    [FromQuery] string? platform,
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate)
{
    // Combine historical DB data with live API data
    var dbPosts = await _context.SocialMediaPosts
        .Where(p => platform == null || p.Platform == platform)
        .Where(p => startDate == null || p.CreatedAt >= startDate)
        .Where(p => endDate == null || p.CreatedAt <= endDate)
        .ToListAsync();
    
    return Ok(new SocialAnalyticsDto
    {
        TotalPosts = dbPosts.Count,
        TotalReach = dbPosts.Sum(p => p.Reach),
        TotalEngagement = dbPosts.Sum(p => p.Likes + p.Comments + p.Shares),
        AvgEngagementRate = dbPosts.Average(p => p.EngagementRate),
        TotalDonationReferrals = dbPosts.Sum(p => p.DonationReferrals),
        TotalDonationValue = dbPosts.Sum(p => p.EstimatedDonationValuePhp),
        PostsByPlatform = dbPosts.GroupBy(p => p.Platform).ToDictionary(g => g.Key, g => g.Count()),
        PostsByContentType = dbPosts.GroupBy(p => p.PostType).ToDictionary(g => g.Key, g => g.Count()),
        EngagementByDayOfWeek = dbPosts.GroupBy(p => p.DayOfWeek)
            .ToDictionary(g => g.Key, g => g.Average(p => p.EngagementRate)),
        EngagementByHour = dbPosts.GroupBy(p => p.PostHour)
            .ToDictionary(g => g.Key, g => g.Average(p => p.EngagementRate)),
    });
}
```

---

## Frontend — Social Media Command Center

See `agents/frontend-agent.md` for full UI spec. Key points:

1. **Platform tabs** with animated underline indicator
2. **Compose panel** with platform multi-select, media upload, caption editor, hashtag suggestions, scheduling
3. **Analytics dashboard** with animated charts, stat counters, heatmap
4. **Comments inbox** with unified feed, inline reply, moderation actions
5. **ML recommendations** panel showing optimal posting strategy

---

## Account Connection Settings Page

Add a settings page (or section in admin settings) where admin can:
1. See which social media accounts are connected (green checkmark)
2. Click "Connect" for each platform → initiates OAuth flow
3. Disconnect an account (revoke token)
4. See token expiration dates and refresh status

```
/admin/settings/social-accounts
  ┌─────────────────────────────────────────┐
  │ Facebook    ✅ Connected (Page: Pharos)  │  [Disconnect]
  │ Instagram   ✅ Connected (@pharos_ph)    │  [Disconnect]
  │ LinkedIn    ⬜ Not Connected              │  [Connect]
  │ YouTube     ✅ Connected (Pharos Channel)│  [Disconnect]
  │ TikTok      ⬜ Not Connected              │  [Connect]
  │ Twitter/X   ⬜ Not Connected              │  [Connect]
  │ WhatsApp    ℹ️  Display Only (from data)  │
  └─────────────────────────────────────────┘
```

---

## Rate Limits to Respect

| Platform | Limit | Strategy |
|---|---|---|
| Facebook/Instagram | 200 calls/user/hour | Cache responses, batch where possible |
| LinkedIn | 100 calls/day for community management | Cache aggressively, limit real-time fetches |
| YouTube | 10,000 units/day (free) | Upload costs 1,600 units — limit to ~6 uploads/day |
| TikTok | Varies by app approval | Use draft inbox option when unsure |
| Twitter/X | Pay-per-use | Track spend, warn before costly operations |

---

## Fallback Strategy

If API integration proves too complex for the timeline, the fallback is:
1. **Always show historical data from the CSV** — analytics, charts, correlations are all available from the `social_media_posts` table
2. **Compose form generates a draft** — stores in local DB, shows a "Copy to clipboard" + "Open [platform]" button for manual posting
3. **Comments link out** — "View comments on [platform]" button instead of inline inbox

This ensures the Social Media Command Center is still impressive even without live API connections. The analytics and ML recommendations work entirely from the existing data.

---

## Environment Variables Needed

```
# Meta (Facebook + Instagram)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://pharos.azurewebsites.net/api/admin/social-media/callback/meta

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://pharos.azurewebsites.net/api/admin/social-media/callback/linkedin

# YouTube (Google)
GOOGLE_CLIENT_ID=       # Same as Google OAuth for login
GOOGLE_CLIENT_SECRET=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://pharos.azurewebsites.net/api/admin/social-media/callback/tiktok

# Twitter/X
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=https://pharos.azurewebsites.net/api/admin/social-media/callback/twitter
```

All stored in `.env` (development) and Azure App Settings (production). Never in source code.
