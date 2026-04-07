# Backend Agent — Pharos

> Reference `CLAUDE.md` for project context, database schema, API structure, auth model, and coding standards.

You are responsible for maintaining and extending the .NET 10 / C# backend API for Pharos. The backend is **largely built** — this document inventories what exists and specifies what still needs to be added.

---

## What Already Exists (DO NOT REBUILD)

The backend is functional with 18 controllers, 15 services, 18 entity models, 12 DTO files, 2 DbContexts, 2 seeders, and 2 middleware classes. Database is **PostgreSQL via Supabase** (Npgsql, NOT SQL Server).

### Existing Controllers — Complete Inventory

| Controller | Route | Methods | Auth |
|---|---|---|---|
| `AuthController` | `api/auth` | POST login, POST register, POST logout, GET me, POST google-login, GET google-callback, POST mfa/enable, POST mfa/verify, POST mfa/confirm-enable, POST mfa/disable, POST change-password | Mixed (some [Authorize], some anonymous) |
| `UsersController` | `api/admin/users` | GET (list), PUT {id}/roles, POST {id}/unlock | Admin |
| `PublicController` | `api/public` | GET impact-snapshots, GET impact-snapshots/{id}, GET safehouses/summary | Anonymous |
| `DonorPortalController` | `api/donor` | GET my-profile, GET my-donations, GET my-impact | Donor |
| `SafehousesController` | `api/admin/safehouses` | GET, GET {id}, POST, PUT {id} | Admin (GET: Admin,Staff) |
| `SupportersController` | `api/admin/supporters` | GET, GET {id}, POST, PUT {id}, DELETE {id} | Admin (GET: Admin,Staff) |
| `DonationsController` | `api/admin/donations` | GET, GET {id}, POST, PUT {id}, DELETE {id} | Admin (GET: Admin,Staff) |
| `DonationAllocationsController` | `api/admin/donation-allocations` | GET, POST | Admin (GET: Admin,Staff) |
| `ResidentsController` | `api/admin/residents` | GET, GET {id}, GET {id}/summary, POST, PUT {id}, DELETE {id}, GET {id}/process-recordings, GET {id}/home-visitations | Admin (GET: Admin,Staff) |
| `ProcessRecordingsController` | `api/admin/process-recordings` | GET, GET {id}, POST, PUT {id} | Admin (GET: Admin,Staff) |
| `HomeVisitationsController` | `api/admin/home-visitations` | GET, POST, PUT {id} | Admin (GET: Admin,Staff) |
| `EducationController` | `api/admin/education-records` | GET, POST, PUT {id} | Admin (GET: Admin,Staff) |
| `HealthController` | `api/admin/health-records` | GET, POST, PUT {id} | Admin (GET: Admin,Staff) |
| `InterventionPlansController` | `api/admin/intervention-plans` | GET, POST, PUT {id} | Admin (GET: Admin,Staff) |
| `IncidentReportsController` | `api/admin/incident-reports` | GET, POST, PUT {id}, DELETE {id} | Admin (GET: Admin,Staff) |
| `PartnersController` | `api/admin/partners` | GET, POST, PUT {id} | Admin (GET: Admin,Staff) |
| `SocialMediaController` | `api/admin/social-media` | GET posts, GET analytics, POST compose, POST comments/{id}/reply, GET comments/inbox | Admin (GET: Admin,Staff) |
| `ReportsController` | `api/admin/reports` | GET donations, GET outcomes, GET safehouses, GET social-media | Admin (GET: Admin,Staff) |
| `MLController` | `api/ml` | GET donor-churn-risk, GET reintegration-readiness/{residentId}, GET social-media-recommendations, GET intervention-effectiveness | Admin |

### Existing Services

| Service | Interface | Purpose |
|---|---|---|
| `SafehouseService` | `ISafehouseService` | Safehouse CRUD + public summaries. Has `DeleteAsync` method (unused by controller). |
| `DonorService` | `IDonorService` | Supporters CRUD, donations CRUD, allocations, donor portal profile/donations/impact |
| `ResidentService` | `IResidentService` | Residents CRUD, case conference summary, process recordings, home visitations, education, health, interventions, incidents |
| `SocialMediaService` | `ISocialMediaService` | Posts listing, analytics aggregates, `ComposePostAsync` (stores to DB only — no external API) |
| `ReportService` | `IReportService` | Donation/outcomes/safehouse/social reports, public impact snapshots |
| `PartnerService` | `IPartnerService` | Partners: list paged, create, update |
| `MLService` | `IMLService` | Heuristic/stub ML: churn scores, reintegration readiness, social recommendations, intervention effectiveness |
| `CommonPasswordValidator` | `IPasswordValidator<TUser>` | Blocklist + no email/username substring in password |

### Existing DTOs (in `DTOs/`)

| File | Contents |
|---|---|
| `Common.cs` | `PagedResult<T>`, `ApiResponse<T>`, `ApiMessage` |
| `AuthDtos.cs` | Login/register requests/responses, `UserInfoDto`, MFA setup/verify, Google, change password |
| `SafehouseDtos.cs` | Safehouse list/detail/summary, create/update, monthly metric DTO |
| `SupporterDtos.cs` | Supporter list/detail, create/update |
| `DonationDtos.cs` | Donation list/detail, in-kind item, allocation, create/update requests |
| `ResidentDtos.cs` | Resident list/detail/summary, create/update |
| `CaseManagementDtos.cs` | Process recording, home visit, education, health, intervention, incident DTOs + create/update requests |
| `SocialMediaDtos.cs` | Post DTO, analytics breakdowns, compose/comment requests |
| `PartnerDtos.cs` | Partner DTO, create/update, assignment DTO |
| `ReportDtos.cs` | Donation/outcomes/safehouse/social report DTOs, `PublicImpactSnapshotDto` |
| `MLDtos.cs` | Churn, readiness, social ML, intervention effectiveness DTOs |
| `DonorPortalDtos.cs` | Donor profile, impact journey, timeline, allocations, user management DTOs |

### Existing Models (in `Models/`)

All 18 entity types for the 17 CSV tables plus `ApplicationUser`. Configured in `PharosDbContext.OnModelCreating` with snake_case column names.

### Data Layer (in `Data/`)

- `PharosDbContext.cs` — Main EF context, all domain tables
- `PharosIdentityDbContext.cs` — Identity context for `ApplicationUser`
- `DataSeeder.cs` — Loads 17 CSVs from `lighthouse_csv_v7/` in FK order
- `IdentitySeeder.cs` — Roles + seed users (admin, donor, admin-mfa)
- Migrations exist for both contexts

### Middleware (in `Middleware/`)

- `ErrorHandlingMiddleware.cs` — Try/catch pipeline, maps exceptions to JSON responses
- `SecurityHeadersMiddleware.cs` — CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy

### Program.cs Pipeline

`ErrorHandlingMiddleware` → (prod) HSTS → `UseHttpsRedirection` → `SecurityHeadersMiddleware` → Swagger (dev) → CORS → Authentication → Authorization → Controllers.

---

## What Needs to Be Added

### 1. Dashboard Aggregate Endpoint (NEW)

The frontend admin dashboard currently makes zero API calls (uses mock data). Create a single endpoint that returns everything the dashboard needs in one call.

**Controller:** Add to a new `DashboardController.cs` or add to `ReportsController`

```
GET /api/admin/dashboard
[Authorize(Roles = "Admin,Staff")]
```

**Response DTO (`DashboardDtos.cs`):**

```csharp
public record DashboardDto(
    DashboardStatsDto Stats,
    IEnumerable<MonthlyDonationTrendDto> DonationTrends,
    IEnumerable<SafehouseOccupancyDto> SafehouseOccupancy,
    IEnumerable<ActivityFeedItemDto> RecentActivity,
    IEnumerable<RiskAlertDto> RiskAlerts
);

public record DashboardStatsDto(
    int ActiveResidents,
    decimal MonthlyDonationTotal,
    decimal MonthlyDonationChange,
    int CasesNeedingReview,
    decimal AvgSocialEngagement,
    decimal SocialEngagementChange
);

public record SafehouseOccupancyDto(
    int SafehouseId,
    string Name,
    int CurrentOccupancy,
    int CapacityGirls,
    decimal OccupancyRate
);

public record ActivityFeedItemDto(
    string Type,
    string Description,
    DateTime Timestamp,
    int? RelatedId
);

public record RiskAlertDto(
    string AlertType,
    int RelatedId,
    string Name,
    double RiskScore,
    string RecommendedAction
);
```

**Service (`IDashboardService`):**

Create a `DashboardService` that:
1. Queries `Residents` for active count
2. Queries `Donations` for this month's total + compares to last month
3. Queries `ProcessRecordings` for sessions with `ConcernsFlagged = true` in last 30 days
4. Queries `SocialMediaPosts` for avg engagement this month + last month's comparison
5. Queries `Safehouses` for occupancy data
6. Builds a recent activity feed from the last 20 events across `Donations`, `ProcessRecordings`, `IncidentReports`, `HomeVisitations` (union, sorted by date desc)
7. Calls `IMLService.GetDonorChurnRisksAsync()` for top high-risk donors + `GetReintegrationReadinessAsync()` for at-risk residents

Register in `Program.cs`:
```csharp
builder.Services.AddScoped<IDashboardService, DashboardService>();
```

### 2. Missing Delete Endpoints

**Safehouse DELETE** — The service method `DeleteAsync` exists but isn't exposed:

```csharp
// In SafehousesController.cs, add:
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id)
{
    var deleted = await _service.DeleteAsync(id);
    if (!deleted) return NotFound(new { message = "Safehouse not found." });
    return Ok(new { message = "Safehouse deleted successfully." });
}
```

**Partner DELETE** — Needs both service method and controller endpoint:

```csharp
// In IPartnerService / PartnerService, add:
Task<bool> DeleteAsync(int id);

// In PartnersController.cs, add:
[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id)
{
    var deleted = await _service.DeleteAsync(id);
    if (!deleted) return NotFound(new { message = "Partner not found." });
    return Ok(new { message = "Partner deleted successfully." });
}
```

### 3. User Management Enhancements

The current `UsersController` has list + role update + unlock. Add:

**Invite/Create User:**

```
POST /api/admin/users/invite
[Authorize(Roles = "Admin")]
```

```csharp
public record InviteUserRequest(
    string Email,
    string DisplayName,
    string Password,
    string Role,
    int? LinkedSupporterId
);
```

This should:
1. Create user via `UserManager.CreateAsync`
2. Assign the specified role
3. If role is "Donor" and `LinkedSupporterId` is provided, set `user.LinkedSupporterId`
4. Return the created user info

**Deactivate User:**

```
DELETE /api/admin/users/{id}
[Authorize(Roles = "Admin")]
```

Soft-delete by locking the account:
```csharp
await _userManager.SetLockoutEnabledAsync(user, true);
await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
```

### 4. Social Media Account Management (NEW)

For the social media command center to support real platform integration, create infrastructure for storing OAuth tokens.

**New Model (`Models/SocialMediaAccount.cs`):**

```csharp
public class SocialMediaAccount
{
    public int Id { get; set; }
    public string Platform { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string? AccountId { get; set; }
    public string EncryptedAccessToken { get; set; } = string.Empty;
    public string? EncryptedRefreshToken { get; set; }
    public DateTime ConnectedAt { get; set; }
    public DateTime? TokenExpiresAt { get; set; }
    public string? PageId { get; set; }
    public string Status { get; set; } = "Active";
}
```

**Add to `PharosDbContext`:**
```csharp
public DbSet<SocialMediaAccount> SocialMediaAccounts => Set<SocialMediaAccount>();
```

Configure in `OnModelCreating`:
```csharp
modelBuilder.Entity<SocialMediaAccount>(entity =>
{
    entity.ToTable("social_media_accounts");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Id).HasColumnName("id");
    entity.Property(e => e.Platform).HasColumnName("platform");
    entity.Property(e => e.AccountName).HasColumnName("account_name");
    entity.Property(e => e.AccountId).HasColumnName("account_id");
    entity.Property(e => e.EncryptedAccessToken).HasColumnName("encrypted_access_token");
    entity.Property(e => e.EncryptedRefreshToken).HasColumnName("encrypted_refresh_token");
    entity.Property(e => e.ConnectedAt).HasColumnName("connected_at");
    entity.Property(e => e.TokenExpiresAt).HasColumnName("token_expires_at");
    entity.Property(e => e.PageId).HasColumnName("page_id");
    entity.Property(e => e.Status).HasColumnName("status");
});
```

**Create migration:**
```bash
dotnet ef migrations add AddSocialMediaAccounts --context PharosDbContext
dotnet ef database update --context PharosDbContext
```

**New Endpoints on `SocialMediaController`:**

```
GET  /api/admin/social-media/accounts          — List connected accounts
POST /api/admin/social-media/accounts/{platform}/connect   — Initiate OAuth (returns redirect URL)
GET  /api/admin/social-media/accounts/{platform}/callback  — OAuth callback (exchanges code for token)
DELETE /api/admin/social-media/accounts/{platform}         — Disconnect account
```

**DTOs:**

```csharp
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
```

See `agents/social-media-agent.md` for the full OAuth flow details per platform.

### 5. Enhance ComposePostRequest

The current `ComposePostRequest` only accepts a single `Platform` string. For multi-platform posting, update to accept a list:

```csharp
// In SocialMediaDtos.cs, update:
public record ComposePostRequest(
    List<string> Platforms,       // Changed from single string
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
    DateTime? ScheduledTime       // NEW: null = post now
);
```

Update `SocialMediaService.ComposePostAsync` to:
1. Check which platforms have connected accounts
2. For each platform with a connected account, call the respective platform API
3. For platforms without accounts, store as a draft
4. Save a record in `social_media_posts` for tracking

### 6. CORS Update

Ensure `Program.cs` CORS policy includes the actual Vercel frontend URL. The current config may only have placeholder URLs:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

This reads from `AllowedOrigins__0`, `AllowedOrigins__1`, etc. in Azure App Settings.

---

## Existing Report DTOs (reference for frontend wiring)

These DTOs define the shape of data the frontend will consume. The frontend agent needs these exact shapes:

**`GET /api/admin/reports/donations`** returns `DonationReportDto`:
- `TotalDonations` (decimal), `TotalDonationCount` (int), `AvgDonationAmount` (decimal), `RecurringDonorCount` (int)
- `MonthlyTrends[]` — `{ Month, Total, Count }`
- `CampaignSummaries[]` — `{ CampaignName, Total, Count }`
- `ChannelSummaries[]` — `{ Channel, Total, Count }`

**`GET /api/admin/reports/outcomes`** returns `OutcomesReportDto`:
- `TotalResidents`, `ActiveResidents`, `ReintegratedResidents`
- `RiskLevelBreakdown[]` — `{ RiskLevel, Count }`
- `ReintegrationBreakdown[]` — `{ Status, Count }`
- `AvgHealthScore`, `AvgEducationProgress`

**`GET /api/admin/reports/safehouses`** returns `SafehouseReportDto[]`:
- Per safehouse: `SafehouseId`, `SafehouseName`, `ActiveResidents`, `Capacity`, `OccupancyRate`, `AvgHealthScore`, `AvgEducationProgress`, `RecentIncidents`, `RecentProcessRecordings`, `RecentHomeVisitations`

**`GET /api/admin/reports/social-media`** returns `SocialMediaReportDto`:
- `TotalPosts`, `AvgEngagementRate`, `TotalDonationReferrals`, `TotalEstimatedDonationValue`
- `BestPlatform`, `BestPostType`, `BestContentTopic`, `BestPostHour`, `BestDayOfWeek`

**`GET /api/admin/social-media/analytics`** returns `SocialMediaAnalyticsDto`:
- `TotalPosts`, `AvgEngagementRate`, `TotalDonationReferrals`, `TotalEstimatedDonationValue`
- `ByPlatform[]`, `ByContentTopic[]`, `ByPostType[]`

**`GET /api/ml/donor-churn-risk`** returns churn risk scores per supporter.

**`GET /api/ml/reintegration-readiness/{id}`** returns readiness score + factors per resident.

**`GET /api/ml/social-media-recommendations`** returns recommended posting time/type/platform.

**`GET /api/ml/intervention-effectiveness`** returns intervention effectiveness insights.

---

## Coding Standards Reminder

- Controller-Service pattern: controllers handle HTTP, services handle business logic
- DTOs for all API responses — never expose EF entities directly
- Async/await everywhere
- Return consistent shapes: `{ data, message, errors }` or the DTO directly
- All currency values as `decimal` in PHP
- `[Authorize]` on all CUD endpoints, `[Authorize(Roles = "Admin,Staff")]` on reads
- Delete endpoints require `[Authorize(Roles = "Admin")]` only (staff cannot delete)

---

## Summary Checklist

- [ ] Create `DashboardController` + `DashboardService` with aggregate endpoint
- [ ] Add `DashboardDtos.cs` with stats, activity feed, risk alerts
- [ ] Expose `DELETE /api/admin/safehouses/{id}` in controller
- [ ] Add `DELETE` for partners (service + controller)
- [ ] Add `POST /api/admin/users/invite` endpoint
- [ ] Add `DELETE /api/admin/users/{id}` (soft-delete/lockout)
- [ ] Create `SocialMediaAccount` model + migration
- [ ] Add social media account management endpoints (list, connect, callback, disconnect)
- [ ] Update `ComposePostRequest` for multi-platform + scheduling
- [ ] Verify CORS reads from configuration (not hardcoded)
- [ ] Register new services in `Program.cs`
