# Security Agent — Pharos

> Reference `CLAUDE.md` for project context and `agents/backend-agent.md` for API/auth setup.

You are responsible for all security implementations. Every feature you implement MUST be demonstrated in the video walkthrough or it won't receive credit. Be thorough and make each feature clearly demonstrable.

---

## Rubric Reference (20 points total)

| Requirement | Points | Status |
|---|---|---|
| HTTPS/TLS | 1 | |
| HTTP → HTTPS redirect | 0.5 | |
| Username/password authentication | 3 | |
| Better password policy | 1 | |
| Pages/API endpoints require auth | 1 | |
| RBAC — Admin CUD + endpoints | 1.5 | |
| Delete confirmation | 1 | |
| Credentials stored securely | 1 | |
| Privacy policy | 1 | |
| GDPR cookie consent (fully functional) | 1 | |
| CSP header | 2 | |
| Deployed publicly | 4 | |
| Additional security features | 2 | |
| **Total** | **20** | |

---

## 1. HTTPS/TLS (1 pt)

**Implementation**:
- Azure App Service provides free managed TLS certificates for custom domains and `*.azurewebsites.net`
- Ensure the app is served over HTTPS
- In `Program.cs`: `app.UseHttpsRedirection();`

**Video Demo**: Show the browser URL bar with the lock icon and valid certificate. Click the lock to show certificate details.

---

## 2. HTTP → HTTPS Redirect (0.5 pt)

**Implementation**:
```csharp
// Program.cs
app.UseHttpsRedirection();

// Also in Azure Portal: Settings → TLS/SSL → HTTPS Only = On
```

**Video Demo**: Type the HTTP URL in the browser, show it redirects to HTTPS.

---

## 3. Authentication — Username/Password (3 pts)

**Implementation**: ASP.NET Identity with cookie-based auth.

### Identity Setup
```csharp
// Models/ApplicationUser.cs
public class ApplicationUser : IdentityUser
{
    public int? LinkedSupporterId { get; set; }  // For donor role users
    public string? DisplayName { get; set; }
}

// Data/PharosIdentityDbContext.cs
public class PharosIdentityDbContext : IdentityDbContext<ApplicationUser>
{
    // ...
}
```

### Auth Controller Endpoints
```
POST /api/auth/register    — Create account (email, password, displayName)
POST /api/auth/login       — Email + password → set auth cookie
POST /api/auth/logout      — Clear auth cookie
GET  /api/auth/me          — Return current user info + roles (no auth required on this endpoint itself, returns null if not logged in)
POST /api/auth/google      — Handle Google OAuth callback
```

### Login Flow
1. User submits email + password to `/api/auth/login`
2. Backend validates with `SignInManager.PasswordSignInAsync()`
3. If MFA enabled, return `{ requiresMfa: true }` and prompt for TOTP code
4. On success, ASP.NET Identity sets an httpOnly, Secure, SameSite cookie
5. Frontend receives user object + roles
6. `/api/auth/me` checks session on subsequent page loads

### Registration Flow
1. User submits email, password, display name
2. Backend validates password against policy
3. Creates user with `UserManager.CreateAsync()`
4. Assigns default role (new registrations get no privileged role — admin must assign)
5. Auto-login after registration

**Video Demo**: Show registration with a weak password (demonstrate rejection), then with a valid password. Show login. Show that auth cookie is set (dev tools → Application → Cookies).

---

## 4. Password Policy (1 pt)

> CRITICAL: Must follow class instruction exactly. This is strictly graded.

**Implementation**:
```csharp
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    // Minimum length
    options.Password.RequiredLength = 12;
    
    // Character requirements
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredUniqueChars = 4;
    
    // Account lockout
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.AllowedForNewUsers = true;
    
    // User settings
    options.User.RequireUniqueEmail = true;
});
```

Additionally, implement a custom password validator to block common passwords:
```csharp
public class CommonPasswordValidator<TUser> : IPasswordValidator<TUser> where TUser : class
{
    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "password123!", "Welcome123!", "Changeme123!", "Admin12345!", // etc.
        // Load from a file of top 1000 common passwords
    };
    
    public Task<IdentityResult> ValidateAsync(UserManager<TUser> manager, TUser user, string? password)
    {
        if (password != null && CommonPasswords.Contains(password))
            return Task.FromResult(IdentityResult.Failed(
                new IdentityError { Description = "This password is too common." }));
        return Task.FromResult(IdentityResult.Success);
    }
}

// Register it:
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(...)
    .AddPasswordValidator<CommonPasswordValidator<ApplicationUser>>();
```

**Video Demo**: Show the password configuration in code. Try to register with "password123" — show it fails. Try with "Short1!" — show it fails (too short). Try with a valid 12+ char password with all character types — show it succeeds.

---

## 5. Auth on Pages and API Endpoints (1 pt)

**Implementation**:

### Backend
```csharp
// Public endpoints — NO auth
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase { ... }

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase { ... }

// Admin endpoints — require Admin role
[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class ResidentsController : ControllerBase { ... }

// Donor endpoints — require Donor role
[ApiController]
[Route("api/donor")]
[Authorize(Roles = "Donor")]
public class DonorPortalController : ControllerBase { ... }

// ML endpoints — require Admin
[ApiController]
[Route("api/ml")]
[Authorize(Roles = "Admin")]
public class MLController : ControllerBase { ... }
```

### Frontend
```tsx
// Route guards
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return <LoadingSkeleton />;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
}
```

**Video Demo**: 
1. While logged out, try to access `/admin` — show redirect to login
2. While logged out, call a protected API endpoint via browser/Postman — show 401
3. Log in as donor, try to access admin page — show 403 or redirect
4. Log in as admin, access admin pages — works

---

## 6. RBAC — Admin CUD (1.5 pts)

**Roles**:
| Role | Permissions |
|---|---|
| Admin | Full CRUD on all data, user management |
| Staff | Read all, Create/Update (no Delete) |
| Donor | Read own donation history + impact |
| Unauthenticated | Landing, impact dashboard, privacy, login |

**Implementation**:
- Controller-level `[Authorize(Roles = "Admin")]` for CUD endpoints
- For Staff: `[Authorize(Roles = "Admin,Staff")]` on read endpoints, `[Authorize(Roles = "Admin")]` on delete endpoints
- Donor endpoints scoped: `var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);` then filter by linked supporter_id

**Video Demo**: Log in as admin, create a record, update it, delete it. Show that non-admin roles cannot access CUD endpoints (call API directly, show 403).

---

## 7. Delete Confirmation (1 pt)

**Implementation**: Frontend uses shadcn AlertDialog for ALL delete operations.

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash2 className="h-4 w-4 mr-1" /> Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete {itemName}. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

For critical deletes (residents, supporters), add a type-to-confirm:
```tsx
// User must type the item name to confirm
<Input 
  placeholder={`Type "${itemName}" to confirm`}
  onChange={(e) => setConfirmText(e.target.value)}
/>
<AlertDialogAction 
  disabled={confirmText !== itemName}
  onClick={handleDelete}
>
  Delete
</AlertDialogAction>
```

**Video Demo**: Click delete on a record. Show the confirmation dialog. Show that you must confirm before deletion proceeds. Show a cancelled delete.

---

## 8. Credentials — Stored Securely (1 pt)

**Implementation**:

### Development
- Use `.env` file at project root (backend reads via `DotNetEnv` or env vars)
- `.env` is in `.gitignore` — NEVER committed
- Alternatively, use `dotnet user-secrets`

### Production
- Azure App Service → Configuration → Application Settings
- Connection strings, API keys, Google OAuth secrets all stored there
- Never hardcoded in source code

### .gitignore must include:
```
.env
appsettings.Development.json
*.pfx
*.key
```

### What goes in .env:
```
PHAROS_DB_CONNECTION=Server=tcp:...
IDENTITY_DB_CONNECTION=Server=tcp:...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
YOUTUBE_API_KEY=...
TIKTOK_CLIENT_KEY=...
TWITTER_BEARER_TOKEN=...
ADMIN_PASSWORD=...
DONOR_PASSWORD=...
MFA_ADMIN_PASSWORD=...
```

**Video Demo**: Show `.gitignore` includes `.env`. Show GitHub repo does NOT contain any credentials. Show Azure App Settings where secrets are stored. Show the code reads from configuration, not hardcoded values.

---

## 9. Privacy Policy (1 pt)

**Implementation**: Create a full GDPR-compliant privacy policy page at `/privacy`.

Content sections:
1. Who we are (Pharos organization, contact info)
2. What data we collect (personal info, donation records, usage analytics, cookies)
3. How we use your data (service provision, analytics, communication)
4. Legal basis for processing (consent, legitimate interest, legal obligation)
5. Data sharing (third-party services: Azure, Google Auth, social media APIs)
6. Data retention (how long we keep data)
7. Your rights (access, rectification, erasure, portability, objection)
8. Cookies (types used, how to control)
9. Children's data (special protections for resident data)
10. Changes to this policy
11. Contact information

Link from footer on EVERY page (at minimum the home page).

**Video Demo**: Navigate to the privacy policy from the footer. Scroll through showing it's complete and customized to Pharos (not a generic template).

---

## 10. GDPR Cookie Consent — Fully Functional (1 pt)

**Implementation**:

> "Fully functional" means it actually controls whether non-essential cookies are set. Not just cosmetic.

```tsx
// Cookie categories
interface CookieConsent {
  essential: true;       // Always on
  analytics: boolean;    // Controls analytics tracking
  preferences: boolean;  // Controls preference cookies (theme, etc.)
}
```

### Banner Component
- Fixed bottom of viewport, slides up with spring animation on first visit
- Three buttons: "Accept All", "Manage Preferences", "Reject Non-Essential"
- "Manage Preferences" opens a Sheet with toggles for each category
- Essential cookies toggle is disabled (always on) with explanation
- Save preference to a cookie: `pharos_cookie_consent`
- If rejected/not yet consented, do NOT set analytics cookies

### Integration
- Before setting any non-essential cookie, check consent state
- The dark/light mode preference cookie is a "preference" category cookie
- If user has not consented to preferences, default to system theme

**Video Demo**: 
1. Open site in incognito — show cookie consent banner appears
2. Click "Manage Preferences" — show the toggles
3. Reject non-essential — show only essential cookies exist in dev tools
4. Accept all — show preference/analytics cookies now appear
5. Show it persists (refresh page, banner doesn't reappear)

---

## 11. Content-Security-Policy Header (2 pts)

> CRITICAL: Must be an HTTP HEADER, not a `<meta>` tag. Graders check dev tools → Network → Response Headers.

**Implementation**: Custom middleware that adds the CSP header.

```csharp
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    
    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Content-Security-Policy
        context.Response.Headers.Append("Content-Security-Policy", string.Join("; ",
            "default-src 'self'",
            "script-src 'self'",                    // No inline scripts
            "style-src 'self' 'unsafe-inline'",     // Tailwind needs unsafe-inline for now
            "img-src 'self' data: https:",          // Allow images from HTTPS sources
            "font-src 'self'",
            "connect-src 'self' https://accounts.google.com https://graph.facebook.com https://graph.instagram.com https://api.linkedin.com https://www.googleapis.com https://developers.tiktok.com https://api.twitter.com",
            "frame-src 'self' https://accounts.google.com",  // For Google OAuth popup
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'"
        ));
        
        // Additional security headers
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        
        await _next(context);
    }
}

// Register in Program.cs BEFORE other middleware:
app.UseMiddleware<SecurityHeadersMiddleware>();
```

**IMPORTANT**: Test thoroughly! CSP can break things. If Google OAuth or social media API calls fail, you need to add those origins to `connect-src`. If fonts from a CDN break, add to `font-src`. Test every feature after enabling CSP.

**Video Demo**: Open dev tools → Network tab → click on the document request → scroll to Response Headers → show `Content-Security-Policy` header with its full value. Explain each directive briefly.

---

## 12. Availability — Deployed Publicly (4 pts)

**Implementation**: Deploy to Azure.

### Architecture
- Azure App Service (Linux, B1 tier minimum) for the .NET API
- Azure Static Web App or same App Service for React build
- Azure SQL Database (Basic or S0 tier) for both databases

### Deployment Steps
1. Build React frontend: `npm run build` → outputs to `dist/`
2. Configure .NET to serve the React build as static files
3. Deploy .NET app to Azure App Service via GitHub Actions or `az webapp deploy`
4. Create Azure SQL databases and run migrations
5. Seed data from CSVs
6. Set environment variables in Azure App Settings

### Alternative: Docker
```dockerfile
# Multi-stage build
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/ .
RUN npm ci && npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY backend/ .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=backend-build /publish .
COPY --from=frontend-build /app/frontend/dist ./wwwroot
EXPOSE 8080
ENTRYPOINT ["dotnet", "Pharos.Api.dll"]
```

Deploy container to Azure Container Apps or App Service (Docker deployment = extra credit).

**Video Demo**: Show the live URL working. Show Azure Portal with the deployed resources.

---

## 13. Additional Security Features (2 pts)

Implement multiple for maximum credit:

### A. Google OAuth (Third-Party Auth)
Already configured in backend setup. Frontend needs a "Sign in with Google" button that redirects to Google's OAuth flow.

**Video Demo**: Click Google sign-in, authenticate, show you're logged in.

### B. TOTP MFA (Multi-Factor Authentication)
```csharp
// Enable MFA for a user
[HttpPost("mfa/enable")]
[Authorize]
public async Task<ActionResult<MfaSetupDto>> EnableMfa()
{
    var user = await _userManager.GetUserAsync(User);
    var key = await _userManager.GetAuthenticatorKeyAsync(user!);
    if (string.IsNullOrEmpty(key))
    {
        await _userManager.ResetAuthenticatorKeyAsync(user!);
        key = await _userManager.GetAuthenticatorKeyAsync(user!);
    }
    
    // Return the key and QR code URI for authenticator app
    var uri = $"otpauth://totp/Pharos:{user!.Email}?secret={key}&issuer=Pharos";
    return Ok(new MfaSetupDto(key!, uri));
}

// Verify TOTP code during login
[HttpPost("mfa/verify")]
public async Task<ActionResult> VerifyMfa([FromBody] MfaVerifyRequest request)
{
    var result = await _signInManager.TwoFactorAuthenticatorSignInAsync(request.Code, false, false);
    if (result.Succeeded) return Ok(new { success = true });
    return Unauthorized(new { message = "Invalid code" });
}
```

Frontend: After login returns `requiresMfa: true`, show a TOTP code input screen. Display QR code during MFA setup.

**Video Demo**: Set up MFA on an account (show QR code scanning). Log in to that account — show MFA prompt. Enter code from authenticator app.

**IMPORTANT**: Ensure admin@pharos.org and donor@pharos.org do NOT have MFA. Only admin-mfa@pharos.org has MFA enabled.

### C. HSTS
```csharp
// Program.cs — only in production!
if (app.Environment.IsProduction())
{
    app.UseHsts();
}

// Or configure explicitly:
builder.Services.AddHsts(options => {
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});
```

**Video Demo**: Show `Strict-Transport-Security` header in dev tools response headers.

### D. Browser-Accessible Cookie for User Setting
The dark/light mode toggle saves preference to a cookie that JavaScript can read:

```tsx
// Set theme preference cookie (NOT httpOnly — this is intentional)
document.cookie = `pharos_theme=${theme}; path=/; max-age=31536000; SameSite=Lax; Secure`;

// Read on mount
const getThemeFromCookie = () => {
  const match = document.cookie.match(/pharos_theme=(light|dark)/);
  return match ? match[1] : 'system';
};
```

**Video Demo**: Toggle dark/light mode. Show in dev tools → Cookies that `pharos_theme` cookie exists and is NOT httpOnly. Refresh page — theme persists.

### E. Data Sanitization / Output Encoding
- Backend: Use parameterized queries (EF Core does this by default)
- Frontend: React auto-escapes JSX output (prevents XSS by default)
- Additional: sanitize any user-input HTML (if rich text is used) with a library like `HtmlSanitizer`
- Validate all input with Zod on frontend and FluentValidation or DataAnnotations on backend

```csharp
// Example: Input validation on backend
public class CreateResidentRequestValidator : AbstractValidator<CreateResidentRequest>
{
    public CreateResidentRequestValidator()
    {
        RuleFor(x => x.CaseControlNo).NotEmpty().MaximumLength(20);
        RuleFor(x => x.CaseCategory)
            .Must(x => new[] { "Abandoned", "Foundling", "Surrendered", "Neglected" }.Contains(x));
        RuleFor(x => x.SafehouseId).GreaterThan(0);
        // etc.
    }
}
```

**Video Demo**: Try to input `<script>alert('xss')</script>` in a text field. Show it's sanitized/escaped and doesn't execute.

### F. Deploy Both Databases to Azure SQL (not SQLite)
- Operational database: Azure SQL
- Identity database: Azure SQL (separate database on same server)

**Video Demo**: Show Azure Portal with both databases visible. Show connection in code reads from Azure config.

---

## Security Testing Checklist

Before submission, verify:

- [ ] Can't access admin pages without login
- [ ] Can't access admin API endpoints without admin role
- [ ] Can't access donor endpoints without donor role
- [ ] Password must meet all requirements to register
- [ ] Delete operations show confirmation dialog
- [ ] CSP header present on every response
- [ ] HTTPS enforced, HTTP redirects
- [ ] No credentials in GitHub repo
- [ ] Privacy policy accessible from footer
- [ ] Cookie consent banner appears on first visit
- [ ] Cookie consent actually controls cookie setting
- [ ] Google OAuth works
- [ ] MFA works on designated account
- [ ] HSTS header present in production
- [ ] Theme cookie is browser-accessible
- [ ] No XSS possible in text input fields
