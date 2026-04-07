# Social Media Agent — Pharos

> Reference `CLAUDE.md` for project context.
> Reference `agents/backend-agent.md` for existing API endpoints and what to build.
> Reference `agents/frontend-agent.md` for UI specs and how pages wire to APIs.

You are responsible for integrating social media platform APIs into Pharos — a Social Media Command Center where staff can compose posts, view analytics, and manage comments across multiple platforms from one unified interface.

---

## What Already Exists

### Backend (functional but incomplete)

**`SocialMediaController`** at `api/admin/social-media`:

| Endpoint | Status | Notes |
|---|---|---|
| `GET /posts` | **Working** | Queries `social_media_posts` table, returns paginated `SocialMediaPostDto`. Filters: platform, postType, contentTopic, search. |
| `GET /analytics` | **Working** | Aggregates from `social_media_posts` table. Returns `SocialMediaAnalyticsDto` with breakdowns by platform, content topic, post type. Filters: date range, platform. |
| `POST /compose` | **Stub** | Calls `SocialMediaService.ComposePostAsync` — stores a record in the DB but does NOT call any external platform API. |
| `POST /comments/{id}/reply` | **Placeholder** | Returns a static JSON `{ message: "Reply queued...", replyText }` — no external API call. |
| `GET /comments/inbox` | **Placeholder** | Returns `{ message: "Comment inbox - integration pending.", comments: [] }`. |

**`SocialMediaService`** / **`ISocialMediaService`**:
- `GetPostsAsync` — paginated query from DB
- `GetAnalyticsAsync` — aggregation from DB
- `ComposePostAsync` — creates a DB record (no external posting)

**`SocialMediaDtos.cs`**:
- `SocialMediaPostDto` — full post with all metrics (matches CSV columns)
- `SocialMediaAnalyticsDto` — aggregated analytics with breakdowns
- `ComposePostRequest` — single platform, post type, caption, hashtags, CTA, topic, sentiment, campaign, boosted flag
- `CommentReplyRequest` — just `ReplyText`

**Database**: `social_media_posts` table has 812 rows of historical data from the CSV. This data powers all analytics charts.

### Frontend

**`SocialMediaPage.tsx`** — Three tabs: Posts, Compose, Comments. Currently uses `mockSocialMediaPosts` and `mockSocialComments`. Has compose UI with platform badges, caption textarea, topic/CTA selects, hashtags, schedule datetime, "Post Now" / "Schedule Post" buttons — all toast-only. AI Recommendations and ML Insights cards have hardcoded text.

### What Does NOT Exist Yet

1. **No account connection UI** — There's no way for an admin to connect their Facebook, Instagram, LinkedIn, etc. accounts
2. **No OAuth token storage** — No `SocialMediaAccount` model or table
3. **No external API calls** — Compose doesn't actually post to any platform
4. **No real comment fetching** — Comments inbox returns empty
5. **No settings page** for social media account management

---

## Implementation Plan (Phased)

### Phase 1: Analytics from DB + Account Connection Infrastructure

This phase makes the existing analytics work with real data and builds the foundation for platform connections.

#### 1A. Wire Frontend Analytics to Real API

The analytics already work on the backend. Wire the frontend:

```typescript
// In SocialMediaPage.tsx, replace mock imports:
import { useSocialPosts, useSocialAnalytics } from "@/hooks/useSocialMedia";

const { data: postsData, isLoading: postsLoading } = useSocialPosts(filters);
const { data: analytics, isLoading: analyticsLoading } = useSocialAnalytics(dateRange);
```

Replace hardcoded "AI Recommendations" with ML data:
```typescript
import { useSocialRecommendations } from "@/hooks/useML";
const { data: mlRecs } = useSocialRecommendations();
```

#### 1B. Create Account Connection Settings Page

**New route:** `/admin/settings/social-accounts`

Add to `App.tsx`:
```typescript
const SocialAccountsPage = lazy(() => import("@/pages/admin/SocialAccountsPage"));
// Add route:
<Route path="/admin/settings/social-accounts" element={<SocialAccountsPage />} />
```

Add to `AdminLayout.tsx` sidebar nav (under Settings group):
```
{ label: "Social Accounts", href: "/admin/settings/social-accounts", icon: Link2 }
```

**Page layout:**

```
PageHeader: "Connected Accounts" / "Manage your social media platform connections"

Grid of platform cards (7 total):
┌──────────────────────────────────────────┐
│ 🔵 Facebook                              │
│ Status: ✅ Connected (Page: Pharos PH)   │
│ Token expires: Jun 15, 2026              │
│ [Disconnect]                             │
├──────────────────────────────────────────┤
│ 📸 Instagram                             │
│ Status: ⬜ Not Connected                 │
│ [Connect Instagram]                      │
├──────────────────────────────────────────┤
│ ... LinkedIn, YouTube, TikTok, Twitter   │
├──────────────────────────────────────────┤
│ 💬 WhatsApp                              │
│ Status: ℹ️ Display Only (historical data) │
│ Analytics available from imported data    │
└──────────────────────────────────────────┘
```

Each card:
- Platform icon + name
- Connection status badge (Connected = green, Not Connected = outline)
- If connected: account name, token expiry date, "Disconnect" button (with confirmation dialog)
- If not connected: "Connect [Platform]" button that initiates OAuth

**Frontend hook:**
```typescript
// hooks/useSocialAccounts.ts
export function useSocialAccounts() {
  return useQuery({
    queryKey: ["socialAccounts"],
    queryFn: () => api.get<ConnectedAccount[]>("/admin/social-media/accounts"),
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) =>
      api.delete(`/admin/social-media/accounts/${platform}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["socialAccounts"] }),
  });
}
```

**Connect flow:**
When user clicks "Connect [Platform]":
1. Frontend calls `POST /api/admin/social-media/accounts/{platform}/connect`
2. Backend returns `{ redirectUrl: "https://facebook.com/v25.0/dialog/oauth?..." }`
3. Frontend does `window.location.href = redirectUrl`
4. User authorizes on the platform
5. Platform redirects back to `GET /api/admin/social-media/accounts/{platform}/callback?code=...`
6. Backend exchanges code for token, stores encrypted in DB
7. Backend redirects to `/admin/settings/social-accounts?connected={platform}`
8. Frontend shows success toast

#### 1C. Backend: Account Management Endpoints

See `agents/backend-agent.md` section "Social Media Account Management" for the full specification:
- `SocialMediaAccount` model
- Migration
- CRUD endpoints on `SocialMediaController`
- Token encryption (use ASP.NET Data Protection API)

---

### Phase 2: Compose to Connected Platforms (Meta Ecosystem First)

Once accounts are connected, make the compose form actually post.

#### 2A. Update ComposePostRequest

The current DTO accepts a single `Platform` string. Update to accept multiple platforms and a scheduled time:

```csharp
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
```

#### 2B. Platform Service Layer

Create individual platform service classes:

**`Services/Platforms/FacebookService.cs`:**

```csharp
public class FacebookService : IPlatformPostingService
{
    private readonly HttpClient _http;
    private readonly PharosDbContext _db;

    public async Task<PostResult> PublishAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        var token = Decrypt(account.EncryptedAccessToken);
        var pageId = account.PageId;

        var response = await _http.PostAsync(
            $"https://graph.facebook.com/v25.0/{pageId}/feed",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["message"] = BuildCaption(request),
                ["access_token"] = token
            })
        );

        var result = await response.Content.ReadFromJsonAsync<FacebookPostResponse>();
        return new PostResult(true, "Facebook", result?.Id);
    }

    public async Task<PostResult> ScheduleAsync(SocialMediaAccount account, ComposePostRequest request)
    {
        var token = Decrypt(account.EncryptedAccessToken);
        var pageId = account.PageId;
        var unixTime = new DateTimeOffset(request.ScheduledTime!.Value).ToUnixTimeSeconds();

        var response = await _http.PostAsync(
            $"https://graph.facebook.com/v25.0/{pageId}/feed",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["message"] = BuildCaption(request),
                ["access_token"] = token,
                ["published"] = "false",
                ["scheduled_publish_time"] = unixTime.ToString()
            })
        );

        var result = await response.Content.ReadFromJsonAsync<FacebookPostResponse>();
        return new PostResult(true, "Facebook", result?.Id);
    }
}
```

**Create similar services for:** `InstagramService`, `LinkedInService`, `YouTubeService`, `TikTokService`, `TwitterService`.

**`Services/Platforms/IPlatformPostingService.cs`:**
```csharp
public interface IPlatformPostingService
{
    Task<PostResult> PublishAsync(SocialMediaAccount account, ComposePostRequest request);
    Task<PostResult> ScheduleAsync(SocialMediaAccount account, ComposePostRequest request);
}

public record PostResult(bool Success, string Platform, string? PlatformPostId, string? Error = null);
```

#### 2C. Update SocialMediaService.ComposePostAsync

```csharp
public async Task<SocialMediaPostDto> ComposePostAsync(ComposePostRequest request)
{
    var results = new List<PostResult>();

    foreach (var platform in request.Platforms)
    {
        var account = await _db.SocialMediaAccounts
            .FirstOrDefaultAsync(a => a.Platform == platform && a.Status == "Active");

        if (account == null)
        {
            results.Add(new PostResult(false, platform, null, "Not connected"));
            continue;
        }

        var service = GetPlatformService(platform);
        var result = request.ScheduledTime.HasValue
            ? await service.ScheduleAsync(account, request)
            : await service.PublishAsync(account, request);
        results.Add(result);
    }

    // Save tracking record to social_media_posts table
    var post = MapToEntity(request, results);
    _db.SocialMediaPosts.Add(post);
    await _db.SaveChangesAsync();

    return MapToDto(post);
}
```

#### 2D. Frontend Compose Form Wiring

In `SocialMediaPage.tsx`, replace the toast-only submit:

```typescript
const composeMutation = useMutation({
  mutationFn: (data: ComposePostRequest) =>
    api.post("/admin/social-media/compose", data),
  onSuccess: (result) => {
    toast.success("Post published successfully");
    queryClient.invalidateQueries({ queryKey: ["socialPosts"] });
    // Reset form
  },
  onError: (err) => {
    toast.error("Failed to publish post");
  },
});
```

Make platform badges selectable (toggle state):
```typescript
const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

// Badge onClick:
onClick={() => {
  setSelectedPlatforms(prev =>
    prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
  );
}}
```

Show which platforms are connected (grey out unconnected ones):
```typescript
const { data: accounts } = useSocialAccounts();
const connectedPlatforms = accounts?.map(a => a.platform) ?? [];

// In badge rendering:
const isConnected = connectedPlatforms.includes(platform);
// Disable badge if not connected, show tooltip "Connect in Settings"
```

---

### Phase 3: LinkedIn + YouTube Compose

Follow the same pattern as Phase 2 but for LinkedIn and YouTube APIs.

**LinkedIn:** Uses the Community Management REST API. Posts go to `POST https://api.linkedin.com/rest/posts` with org URN as author. Requires `LinkedIn-Version` header.

**YouTube:** Uses Google.Apis.YouTube.v3 NuGet package. Videos require upload via `Videos.Insert`. Text posts aren't supported — YouTube is video-only.

---

### Phase 4: Comments Inbox (Tier 1 Platforms)

Replace the placeholder `comments/inbox` endpoint with real comment fetching.

**Backend:**

```csharp
public async Task<List<CommentDto>> GetUnifiedInboxAsync(string? platform, int page, int pageSize)
{
    var tasks = new List<Task<List<CommentDto>>>();

    if (platform == null || platform == "Facebook")
        tasks.Add(GetFacebookCommentsAsync());
    if (platform == null || platform == "Instagram")
        tasks.Add(GetInstagramCommentsAsync());
    if (platform == null || platform == "LinkedIn")
        tasks.Add(GetLinkedInCommentsAsync());
    if (platform == null || platform == "YouTube")
        tasks.Add(GetYouTubeCommentsAsync());

    var results = await Task.WhenAll(tasks);
    return results.SelectMany(r => r)
        .OrderByDescending(c => c.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToList();
}
```

**Platform-specific comment fetching:**
- Facebook: `GET /{post-id}/comments?fields=id,message,from,created_time`
- Instagram: `GET /{media-id}/comments?fields=id,text,username,timestamp`
- LinkedIn: Social Metadata API for comments
- YouTube: `CommentThreads.List` via Google API client

**Caching:** Cache comments for 5 minutes to avoid rate limits. Use `IMemoryCache` on the backend.

**Reply:**
```csharp
public async Task ReplyToCommentAsync(string platform, string commentId, string message)
{
    var account = await GetConnectedAccount(platform);
    var token = Decrypt(account.EncryptedAccessToken);

    switch (platform)
    {
        case "Facebook":
            await _http.PostAsync(
                $"https://graph.facebook.com/v25.0/{commentId}/comments",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["message"] = message,
                    ["access_token"] = token
                }));
            break;
        case "Instagram":
            // POST /{comment-id}/replies with message field
            break;
        // ... other platforms
    }
}
```

**Frontend:**
Wire the reply input + button in `SocialMediaPage.tsx` to the reply mutation. Show loading state while replying.

---

### Phase 5: TikTok + Twitter/X (Tier 2)

**TikTok:** Content Posting API. Video-only. `POST /v2/post/publish/video/init/` then poll for status.

**Twitter/X:** API v2. `POST /2/tweets`. Pay-per-use (~$0.01/tweet). Show cost warning in UI.

---

## OAuth Flows by Platform

### Facebook + Instagram (Meta)

```
1. Admin clicks "Connect Facebook" in settings
2. Backend generates redirect URL:
   https://www.facebook.com/v25.0/dialog/oauth
   ?client_id={META_APP_ID}
   &redirect_uri={BACKEND_URL}/api/admin/social-media/accounts/facebook/callback
   &scope=pages_manage_posts,pages_read_engagement,pages_manage_metadata,
          instagram_basic,instagram_content_publish,instagram_manage_comments,
          instagram_manage_insights
3. User authorizes
4. Callback receives ?code=...
5. Exchange code: POST https://graph.facebook.com/v25.0/oauth/access_token
6. Get long-lived token: GET /oauth/access_token?grant_type=fb_exchange_token&...
7. Get Page token: GET /me/accounts → find page → store page_access_token + page_id
8. For Instagram: GET /{page_id}?fields=instagram_business_account → store IG ID
9. Save to SocialMediaAccount table (encrypted tokens)
10. Redirect to frontend settings page
```

### LinkedIn

```
1. Redirect to: https://www.linkedin.com/oauth/v2/authorization
   ?response_type=code&client_id={LINKEDIN_CLIENT_ID}
   &redirect_uri={CALLBACK}&scope=r_organization_social,w_organization_social,rw_organization_admin
2. Exchange code for access_token + refresh_token
3. GET /organizationAcls → find org URN
4. Store token + org URN
5. Tokens expire in 60 days — implement refresh
```

### YouTube

```
1. Google OAuth 2.0 with scopes: youtube.upload, youtube.force-ssl, youtube.readonly
2. Exchange code for access_token + refresh_token
3. GET channels?mine=true → store channel ID
4. Refresh token is long-lived
```

### TikTok

```
1. Redirect to: https://www.tiktok.com/v2/auth/authorize/
   ?client_key={TIKTOK_CLIENT_KEY}&scope=video.publish,video.upload
   &response_type=code&redirect_uri={CALLBACK}
2. Exchange code for access_token (24hr expiry) + refresh_token
3. Must refresh frequently
```

### Twitter/X

```
1. OAuth 2.0 with PKCE
2. Scopes: tweet.write, tweet.read, users.read
3. Exchange code for access_token
```

---

## Rate Limits

| Platform | Limit | Strategy |
|---|---|---|
| Facebook/Instagram | 200 calls/user/hour | Cache responses 5 min, batch reads |
| LinkedIn | 100 calls/day (community) | Cache aggressively, limit fetches |
| YouTube | 10,000 units/day free (upload=1,600) | Max ~6 uploads/day |
| TikTok | Varies by approval | Use draft option |
| Twitter/X | Pay-per-use | Track spend, warn in UI |

---

## Fallback Strategy

If full API integration isn't feasible in the timeline:

1. **Analytics always works** — Historical data from CSV is in the DB. Charts, trends, correlations all render from this data.
2. **Compose creates a draft** — Store in DB, show "Copy to clipboard" + "Open [platform]" button for manual posting.
3. **Comments link out** — "View on [platform]" button instead of inline inbox.
4. **Account settings shows "Coming soon"** — But the UI structure is built and ready.

This ensures the Social Media Command Center is still impressive for grading even without live API connections.

---

## Environment Variables

```
# Meta (Facebook + Instagram)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://pharos-api.azurewebsites.net/api/admin/social-media/accounts/facebook/callback

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://pharos-api.azurewebsites.net/api/admin/social-media/accounts/linkedin/callback

# YouTube (Google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://pharos-api.azurewebsites.net/api/admin/social-media/accounts/tiktok/callback

# Twitter/X
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=https://pharos-api.azurewebsites.net/api/admin/social-media/accounts/twitter/callback
```

All stored in `.env` (development) and Azure App Settings (production). Never in source code.

---

## Summary Checklist

### Phase 1 (Foundation)
- [ ] Wire `SocialMediaPage.tsx` posts/analytics to real API hooks
- [ ] Replace hardcoded ML recommendations with `/api/ml/social-media-recommendations`
- [ ] Create `SocialAccountsPage.tsx` at `/admin/settings/social-accounts`
- [ ] Add route + sidebar nav link
- [ ] Create `SocialMediaAccount` model, migration, endpoints on backend (see backend-agent.md)
- [ ] Build connect/disconnect UI with OAuth redirect flow

### Phase 2 (Meta Compose)
- [ ] Create `FacebookService` + `InstagramService` platform posting services
- [ ] Update `ComposePostRequest` for multi-platform + scheduling
- [ ] Update `SocialMediaService.ComposePostAsync` to call platform APIs
- [ ] Wire frontend compose form to real mutation with platform selection
- [ ] Show connected vs unconnected platforms in compose UI

### Phase 3 (LinkedIn + YouTube)
- [ ] Create `LinkedInService` posting service
- [ ] Create `YouTubeService` posting service (video upload)
- [ ] Add OAuth flows for both platforms

### Phase 4 (Comments Inbox)
- [ ] Implement `GetUnifiedInboxAsync` with real platform API calls
- [ ] Add comment caching (5-minute IMemoryCache)
- [ ] Wire reply endpoint to platform-specific reply APIs
- [ ] Wire frontend comments tab to real inbox endpoint

### Phase 5 (Tier 2 Platforms)
- [ ] Create `TikTokService` (video publish)
- [ ] Create `TwitterService` (tweet publish)
- [ ] Add cost warning UI for Twitter
