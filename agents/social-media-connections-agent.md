# Social Media Connections Agent — Pharos

> Reference `CLAUDE.md` for project context.
> Reference `agents/social-media-agent.md` for the full social media integration plan.

You are responsible for fixing the Social Accounts page so it actually works instead of showing a blank/broken screen, and ensuring each platform's OAuth connection flow is functional.

---

## What Already Exists

### Frontend

**`frontend/src/pages/admin/SocialAccountsPage.tsx`** — Fully built UI with:
- 7 platform cards (Facebook, Instagram, LinkedIn, YouTube, TikTok, Twitter, WhatsApp)
- Connect/Disconnect buttons, status badges, account details panel
- Uses `useSocialAccounts()`, `useConnectSocialAccount()`, `useDisconnectSocialAccount()` from `frontend/src/hooks/useSocialMedia.ts`
- Route at `/admin/settings/social-accounts` in `App.tsx` line 86
- Sidebar nav item in `AdminLayout.tsx` under "Settings" group
- Toast notifications on `?connected=` and `?error=` query params from OAuth redirect

**`frontend/src/hooks/useSocialMedia.ts`** — Account hooks (lines 76-103):
- `useSocialAccounts()` — `GET /admin/social-media/accounts`
- `useConnectSocialAccount()` — `POST /admin/social-media/accounts/{platform}/connect` then `window.location.href = response.redirectUrl`
- `useDisconnectSocialAccount()` — `DELETE /admin/social-media/accounts/{platform}`

### Backend

**`backend/Controllers/SocialMediaController.cs`** (lines 120-199):
- `POST accounts/{platform}/connect` — Resolves platform client, builds OAuth URL, returns `OAuthInitiateResponse`
- `GET accounts/{platform}/callback` — `[AllowAnonymous]`, exchanges code for token, stores encrypted in DB, redirects to frontend
- `GET accounts` — Lists connected accounts
- `DELETE accounts/{platform}` — Disconnects account

**`backend/Services/PlatformClients/`** — 6 platform clients + factory + encryption:
- `FacebookClient.cs` — Meta Graph API OAuth + page token exchange
- `InstagramClient.cs` — Meta Graph API (IG business account via page)
- `LinkedInClient.cs` — LinkedIn OAuth 2.0
- `YouTubeClient.cs` — Google OAuth
- `TikTokClient.cs` — TikTok OAuth v2
- `TwitterClient.cs` — OAuth 2.0 + PKCE (broken — see below)
- `PlatformClientFactory.cs` — Resolves client by platform name
- `TokenEncryptionService.cs` — ASP.NET Data Protection for token storage

**`backend/Models/SocialMediaAccount.cs`** — Entity with encrypted tokens, connected at, expiry, status

**`backend/DTOs/SocialMediaDtos.cs`** — Contains `OAuthInitiateResponse` record

---

## Known Bugs to Fix

### Bug 1: snake_case mismatch on connect redirect (CRITICAL)

The backend serializes all JSON with `JsonNamingPolicy.SnakeCaseLower` (set in `Program.cs`). The `OAuthInitiateResponse` DTO has a property `RedirectUrl` which serializes as `redirect_url`.

But the frontend hook reads `response.redirectUrl` (camelCase):

```typescript
// frontend/src/hooks/useSocialMedia.ts, line 87-90
const response = await api.post<{ redirectUrl: string }>(
  `/admin/social-media/accounts/${platform}/connect`
);
window.location.href = response.redirectUrl; // UNDEFINED — backend sends redirect_url
```

**Fix:** Change the type and access to `redirect_url`:

```typescript
const response = await api.post<{ redirect_url: string }>(
  `/admin/social-media/accounts/${platform}/connect`
);
window.location.href = response.redirect_url;
```

### Bug 2: Twitter PKCE verifier is hardcoded (BROKEN)

In `backend/Services/PlatformClients/TwitterClient.cs`, the `BuildOAuthUrl` method correctly generates a PKCE code verifier and stores it in `IMemoryCache`:

```csharp
// Line 49 — correctly stores verifier
_cache.Set($"twitter_pkce_{state}", codeVerifier, TimeSpan.FromMinutes(10));
```

But `ExchangeCodeAsync` never retrieves it — it uses a hardcoded string `"challenge"`:

```csharp
// Line 78 — BROKEN
["code_verifier"] = "challenge" // PKCE verifier from cache in real flow
```

**Fix:** The `ExchangeCodeAsync` method needs to accept the `state` parameter and look up the cached verifier. But the interface `ISocialPlatformClient.ExchangeCodeAsync` only takes `(string code, string redirectUri)`. There are two approaches:

**Approach A (simpler):** Pass `state` through the OAuth callback to `ExchangeCodeAsync`. Modify the interface to add an optional `state` parameter:

In `backend/Services/PlatformClients/ISocialPlatformClient.cs`:
```csharp
Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri, string? state = null);
```

In `TwitterClient.ExchangeCodeAsync`, retrieve the verifier:
```csharp
public async Task<OAuthTokenResult> ExchangeCodeAsync(string code, string redirectUri, string? state = null)
{
    var codeVerifier = state != null
        ? _cache.Get<string>($"twitter_pkce_{state}") ?? "challenge"
        : "challenge";

    // ... use codeVerifier in the token request
    ["code_verifier"] = codeVerifier
}
```

In `SocialMediaController.OAuthCallback`, pass state through:
```csharp
var tokenResult = await client.ExchangeCodeAsync(code, redirectUri, state);
```

All other platform clients just ignore the `state` parameter since they have default values.

### Bug 3: No error handling when API keys are not configured

When no API keys are set (e.g., `SocialMedia:Meta:AppId` is null), clicking "Connect Facebook" crashes silently because `_config["SocialMedia:Meta:AppId"]` returns null, and the OAuth URL becomes malformed.

**Fix:** Add a configuration check endpoint and graceful degradation:

1. Add a new backend endpoint `GET /admin/social-media/accounts/status` that returns which platforms have API keys configured:

```csharp
[HttpGet("accounts/status")]
[Authorize(Roles = "Admin,Staff")]
public IActionResult GetPlatformStatus()
{
    var statuses = new Dictionary<string, bool>
    {
        ["facebook"] = !string.IsNullOrWhiteSpace(_config["SocialMedia:Meta:AppId"]),
        ["instagram"] = !string.IsNullOrWhiteSpace(_config["SocialMedia:Meta:AppId"]),
        ["linkedin"] = !string.IsNullOrWhiteSpace(_config["SocialMedia:LinkedIn:ClientId"]),
        ["youtube"] = !string.IsNullOrWhiteSpace(_config["SocialMedia:Google:ClientId"]),
        ["tiktok"] = !string.IsNullOrWhiteSpace(_config["SocialMedia:TikTok:ClientKey"]),
        ["twitter"] = !string.IsNullOrWhiteSpace(_config["SocialMedia:Twitter:ClientId"]),
    };
    return Ok(statuses);
}
```

2. Add a frontend hook:

```typescript
export function usePlatformStatus() {
  return useQuery({
    queryKey: ["platformStatus"],
    queryFn: () => api.get<Record<string, boolean>>("/admin/social-media/accounts/status"),
  });
}
```

3. In `SocialAccountsPage.tsx`, use this to show "Not Configured" state:
   - If keys are not configured: show an info panel instead of the Connect button with text like "API keys not configured. Add SocialMedia:Meta:AppId and SocialMedia:Meta:AppSecret to your environment."
   - If keys ARE configured but not connected: show the normal "Connect" button
   - If connected: show normal connected state

---

## Platform-Specific Setup Instructions

Add a collapsible "Setup Instructions" section to each platform card on `SocialAccountsPage.tsx` when the platform is not configured. Use a shadcn `Collapsible` or simple toggle.

### Facebook / Instagram (shared Meta setup)
- Go to [Meta for Developers](https://developers.facebook.com/)
- Create an App (type: Business)
- Add Facebook Login product
- Set Valid OAuth Redirect URIs to: `{BACKEND_URL}/api/admin/social-media/accounts/facebook/callback`
- Get App ID and App Secret
- Environment variables: `SocialMedia__Meta__AppId`, `SocialMedia__Meta__AppSecret`
- Facebook and Instagram share the same Meta App — connecting Facebook with the right permissions gives Instagram access too

### LinkedIn
- Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
- Create an App, verify your company page
- Add "Community Management API" product
- Set Redirect URLs to: `{BACKEND_URL}/api/admin/social-media/accounts/linkedin/callback`
- Environment variables: `SocialMedia__LinkedIn__ClientId`, `SocialMedia__LinkedIn__ClientSecret`

### YouTube (Google)
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a project, enable YouTube Data API v3
- Create OAuth 2.0 credentials (Web application)
- Add Redirect URI: `{BACKEND_URL}/api/admin/social-media/accounts/youtube/callback`
- Environment variables: `SocialMedia__Google__ClientId`, `SocialMedia__Google__ClientSecret`

### TikTok
- Go to [TikTok for Developers](https://developers.tiktok.com/)
- Create an App, apply for Content Posting API access
- Set Redirect URI: `{BACKEND_URL}/api/admin/social-media/accounts/tiktok/callback`
- Environment variables: `SocialMedia__TikTok__ClientKey`, `SocialMedia__TikTok__ClientSecret`

### Twitter/X
- Go to [X Developer Portal](https://developer.twitter.com/)
- Create a Project + App with OAuth 2.0 (User Authentication)
- Set Redirect URI: `{BACKEND_URL}/api/admin/social-media/accounts/twitter/callback`
- Select "Read and Write" permissions, enable "Request email from users"
- Environment variables: `SocialMedia__Twitter__ClientId`, `SocialMedia__Twitter__ClientSecret`

### WhatsApp
- Display-only. No API connection needed. Historical analytics data is available from the imported CSV. The card should say "Analytics available from imported data" with no Connect button (already implemented).

---

## Additional Configuration

Add to `backend/.env` (template, not real values):
```
SocialMedia__CallbackBaseUrl=https://pharos-api.azurewebsites.net
SocialMedia__FrontendUrl=https://pharos-snowy.vercel.app

SocialMedia__Meta__AppId=
SocialMedia__Meta__AppSecret=
SocialMedia__LinkedIn__ClientId=
SocialMedia__LinkedIn__ClientSecret=
SocialMedia__Google__ClientId=
SocialMedia__Google__ClientSecret=
SocialMedia__TikTok__ClientKey=
SocialMedia__TikTok__ClientSecret=
SocialMedia__Twitter__ClientId=
SocialMedia__Twitter__ClientSecret=
```

---

## UI Enhancements

1. Each platform card should show one of three states clearly:
   - **Connected** (green badge, account name, token expiry, Disconnect button) — already implemented
   - **Not Connected / Ready** (outline badge, Connect button) — already implemented
   - **Not Configured** (amber/warning badge, setup instructions) — NEW

2. Add a small "Setup Guide" expandable/collapsible under each unconfigured platform card that shows which env vars are needed and links to the developer portal.

3. The page should always render correctly, never blank. If the `GET /accounts` call fails, show an error state with a Retry button.

4. Add error boundary handling: if `useConnectSocialAccount` fails (e.g., 500 from missing config), show a toast with a helpful message instead of silently redirecting to `undefined`.

---

## Files to Modify

| File | Changes |
|---|---|
| `frontend/src/hooks/useSocialMedia.ts` | Fix `redirectUrl` to `redirect_url` in `useConnectSocialAccount`. Add `usePlatformStatus` hook. Add error handling to connect mutation. |
| `frontend/src/pages/admin/SocialAccountsPage.tsx` | Add "Not Configured" state per platform. Add setup instructions collapsible. Add error handling for failed API calls. |
| `backend/Services/PlatformClients/ISocialPlatformClient.cs` | Add optional `state` parameter to `ExchangeCodeAsync` |
| `backend/Services/PlatformClients/TwitterClient.cs` | Fix `ExchangeCodeAsync` to retrieve PKCE verifier from cache using `state` |
| `backend/Services/PlatformClients/FacebookClient.cs` | Add `state` param (unused, just signature match) |
| `backend/Services/PlatformClients/InstagramClient.cs` | Add `state` param (unused) |
| `backend/Services/PlatformClients/LinkedInClient.cs` | Add `state` param (unused) |
| `backend/Services/PlatformClients/YouTubeClient.cs` | Add `state` param (unused) |
| `backend/Services/PlatformClients/TikTokClient.cs` | Add `state` param (unused) |
| `backend/Controllers/SocialMediaController.cs` | Add `GET accounts/status` endpoint. Pass `state` to `ExchangeCodeAsync`. |

---

## Checklist

- [ ] Fix `redirect_url` snake_case mismatch in `useSocialMedia.ts`
- [ ] Fix Twitter PKCE verifier retrieval in `TwitterClient.cs`
- [ ] Add `state` parameter to `ISocialPlatformClient.ExchangeCodeAsync` interface
- [ ] Update all 6 platform client `ExchangeCodeAsync` signatures
- [ ] Pass `state` from `SocialMediaController.OAuthCallback` to `ExchangeCodeAsync`
- [ ] Add `GET accounts/status` endpoint to check which platforms have API keys configured
- [ ] Add `usePlatformStatus` hook to frontend
- [ ] Add "Not Configured" state to `SocialAccountsPage.tsx` platform cards
- [ ] Add setup instructions per platform with developer portal links
- [ ] Add error handling / toast messages for failed connect attempts
- [ ] Ensure page never shows blank — graceful error states everywhere
- [ ] Verify both backend and frontend build cleanly
