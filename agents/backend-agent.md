# Backend Agent — Pharos

> Reference `CLAUDE.md` for project context, database schema, API structure, auth model, and coding standards.

You are responsible for building the entire .NET 10 / C# backend API for Pharos. This includes Entity Framework models for all 17 tables, REST API controllers, ASP.NET Identity auth, RBAC authorization, and ML model serving endpoints.

---

## Project Setup

```bash
dotnet new webapi -n Pharos.Api --framework net10.0
cd Pharos.Api

# Required packages
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package Microsoft.AspNetCore.Authentication.Google
dotnet add package Microsoft.AspNetCore.Authentication.Cookies
dotnet add package Microsoft.ML                         # For loading ML models
dotnet add package Microsoft.ML.OnnxRuntime              # If using ONNX models
dotnet add package CsvHelper                             # For initial data seeding
```

---

## Program.cs Configuration Outline

```csharp
var builder = WebApplication.CreateBuilder(args);

// DbContexts
builder.Services.AddDbContext<PharosDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("PharosDb")));
builder.Services.AddDbContext<PharosIdentityDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("IdentityDb")));

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    // Password policy — see security-agent.md for exact values
    options.Password.RequiredLength = 12;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredUniqueChars = 4;
    
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<PharosIdentityDbContext>()
.AddDefaultTokenProviders();

// Cookie auth
builder.Services.ConfigureApplicationCookie(options => {
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax; // Lax for OAuth redirect support
    options.ExpireTimeSpan = TimeSpan.FromHours(24);
    options.LoginPath = "/api/auth/login";
    options.Events.OnRedirectToLogin = context => {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context => {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// Google Auth
builder.Services.AddAuthentication()
    .AddGoogle(options => {
        options.ClientId = builder.Configuration["Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
    });

// CORS for React dev server
builder.Services.AddCors(options => {
    options.AddPolicy("Frontend", policy => {
        policy.WithOrigins("http://localhost:5173", "https://pharos.azurewebsites.net")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Services
builder.Services.AddScoped<IDonorService, DonorService>();
builder.Services.AddScoped<IResidentService, ResidentService>();
builder.Services.AddScoped<ISocialMediaService, SocialMediaService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IMLService, MLService>();
// ... more services

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

// Security middleware — see security-agent.md
app.UseHttpsRedirection();
// CSP header middleware
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Entity Framework Models

> Map all 17 tables. Use PascalCase C# properties that EF maps to snake_case DB columns via `modelBuilder.Entity<T>().ToTable("table_name")` and `.HasColumnName("column_name")`.

### Configuration Strategy
- Use Fluent API in `OnModelCreating` for all table/column mappings
- Configure snake_case column names explicitly
- Set up all foreign key relationships
- Use `decimal(18,2)` for all monetary values
- Use `DateTime` for dates, `DateTimeOffset` for timestamps with timezone

### Entity Examples (build all 17)

```csharp
public class Safehouse
{
    public int SafehouseId { get; set; }
    public string SafehouseCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public DateTime OpenDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CapacityGirls { get; set; }
    public int CapacityStaff { get; set; }
    public int CurrentOccupancy { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public ICollection<Resident> Residents { get; set; } = new List<Resident>();
    public ICollection<PartnerAssignment> PartnerAssignments { get; set; } = new List<PartnerAssignment>();
    public ICollection<DonationAllocation> DonationAllocations { get; set; } = new List<DonationAllocation>();
    public ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();
    public ICollection<SafehouseMonthlyMetric> MonthlyMetrics { get; set; } = new List<SafehouseMonthlyMetric>();
}

public class Supporter
{
    public int SupporterId { get; set; }
    public string SupporterType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string RelationshipType { get; set; } = string.Empty;
    public string? Region { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? FirstDonationDate { get; set; }
    public string? AcquisitionChannel { get; set; }
    
    public ICollection<Donation> Donations { get; set; } = new List<Donation>();
}

public class Donation
{
    public int DonationId { get; set; }
    public int SupporterId { get; set; }
    public string DonationType { get; set; } = string.Empty;
    public DateTime DonationDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string ChannelSource { get; set; } = string.Empty;
    public string? CurrencyCode { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public string? Notes { get; set; }
    public int? ReferralPostId { get; set; }
    
    public Supporter Supporter { get; set; } = null!;
    public SocialMediaPost? ReferralPost { get; set; }
    public ICollection<InKindDonationItem> InKindItems { get; set; } = new List<InKindDonationItem>();
    public ICollection<DonationAllocation> Allocations { get; set; } = new List<DonationAllocation>();
}

public class Resident
{
    public int ResidentId { get; set; }
    public string CaseControlNo { get; set; } = string.Empty;
    public string InternalCode { get; set; } = string.Empty;
    public int SafehouseId { get; set; }
    public string CaseStatus { get; set; } = string.Empty;
    public string Sex { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? BirthStatus { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? Religion { get; set; }
    public string CaseCategory { get; set; } = string.Empty;
    public bool SubCatOrphaned { get; set; }
    public bool SubCatTrafficked { get; set; }
    public bool SubCatChildLabor { get; set; }
    public bool SubCatPhysicalAbuse { get; set; }
    public bool SubCatSexualAbuse { get; set; }
    public bool SubCatOsaec { get; set; }
    public bool SubCatCicl { get; set; }
    public bool SubCatAtRisk { get; set; }
    public bool SubCatStreetChild { get; set; }
    public bool SubCatChildWithHiv { get; set; }
    public bool IsPwd { get; set; }
    public string? PwdType { get; set; }
    public bool HasSpecialNeeds { get; set; }
    public string? SpecialNeedsDiagnosis { get; set; }
    public bool FamilyIs4ps { get; set; }
    public bool FamilySoloParent { get; set; }
    public bool FamilyIndigenous { get; set; }
    public bool FamilyParentPwd { get; set; }
    public bool FamilyInformalSettler { get; set; }
    public DateTime DateOfAdmission { get; set; }
    public string? AgeUponAdmission { get; set; }
    public string? PresentAge { get; set; }
    public string? LengthOfStay { get; set; }
    public string? ReferralSource { get; set; }
    public string? ReferringAgencyPerson { get; set; }
    public DateTime? DateColbRegistered { get; set; }
    public DateTime? DateColbObtained { get; set; }
    public string? AssignedSocialWorker { get; set; }
    public string? InitialCaseAssessment { get; set; }
    public DateTime? DateCaseStudyPrepared { get; set; }
    public string? ReintegrationType { get; set; }
    public string? ReintegrationStatus { get; set; }
    public string? InitialRiskLevel { get; set; }
    public string? CurrentRiskLevel { get; set; }
    public DateTime DateEnrolled { get; set; }
    public DateTime? DateClosed { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? NotesRestricted { get; set; }
    
    public Safehouse Safehouse { get; set; } = null!;
    public ICollection<ProcessRecording> ProcessRecordings { get; set; } = new List<ProcessRecording>();
    public ICollection<HomeVisitation> HomeVisitations { get; set; } = new List<HomeVisitation>();
    public ICollection<EducationRecord> EducationRecords { get; set; } = new List<EducationRecord>();
    public ICollection<HealthWellbeingRecord> HealthRecords { get; set; } = new List<HealthWellbeingRecord>();
    public ICollection<InterventionPlan> InterventionPlans { get; set; } = new List<InterventionPlan>();
    public ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();
}

// Build the remaining entities following the same pattern:
// - InKindDonationItem
// - DonationAllocation
// - Partner
// - PartnerAssignment
// - ProcessRecording
// - HomeVisitation
// - EducationRecord
// - HealthWellbeingRecord
// - InterventionPlan
// - IncidentReport
// - SocialMediaPost
// - SafehouseMonthlyMetric
// - PublicImpactSnapshot
```

### DbContext

```csharp
public class PharosDbContext : DbContext
{
    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure all table names and column names to snake_case
        // Configure all foreign key relationships
        // Configure decimal precision for monetary values
        // See individual entity configurations below
    }
}
```

---

## Controller Structure

### Base Pattern
```csharp
[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class SupportersController : ControllerBase
{
    private readonly IDonorService _donorService;
    
    [HttpGet]
    public async Task<ActionResult<PagedResult<SupporterDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? supporterType = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var result = await _donorService.GetSupportersAsync(page, pageSize, supporterType, status, search);
        return Ok(result);
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<SupporterDetailDto>> GetById(int id) { ... }
    
    [HttpPost]
    public async Task<ActionResult<SupporterDto>> Create([FromBody] CreateSupporterRequest request) { ... }
    
    [HttpPut("{id}")]
    public async Task<ActionResult<SupporterDto>> Update(int id, [FromBody] UpdateSupporterRequest request) { ... }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) { ... }
}
```

### Controllers to Build

| Controller | Route Base | Auth | Purpose |
|---|---|---|---|
| `AuthController` | `/api/auth` | Mixed | Login, register, logout, me, Google login, MFA setup |
| `PublicController` | `/api/public` | None | Impact snapshots, anonymized safehouse summary |
| `DonorPortalController` | `/api/donor` | Donor | Personalized donor dashboard, their donations, impact |
| `SafehousesController` | `/api/admin/safehouses` | Admin | CRUD safehouses |
| `SupportersController` | `/api/admin/supporters` | Admin | CRUD supporters |
| `DonationsController` | `/api/admin/donations` | Admin | CRUD donations + allocations |
| `ResidentsController` | `/api/admin/residents` | Admin | CRUD residents + case conference summary |
| `ProcessRecordingsController` | `/api/admin/process-recordings` | Admin | CRUD process recordings |
| `HomeVisitationsController` | `/api/admin/home-visitations` | Admin | CRUD home visitations |
| `EducationController` | `/api/admin/education-records` | Admin | CRUD education records |
| `HealthController` | `/api/admin/health-records` | Admin | CRUD health/wellbeing records |
| `InterventionPlansController` | `/api/admin/intervention-plans` | Admin | CRUD intervention plans |
| `IncidentReportsController` | `/api/admin/incident-reports` | Admin | CRUD incident reports |
| `SocialMediaController` | `/api/admin/social-media` | Admin | Posts analytics, compose, comments |
| `ReportsController` | `/api/admin/reports` | Admin | Aggregated analytics endpoints |
| `PartnersController` | `/api/admin/partners` | Admin | CRUD partners + assignments |
| `MLController` | `/api/ml` | Admin | ML prediction endpoints |
| `UsersController` | `/api/admin/users` | Admin | User management (Identity) |

---

## DTO Pattern

Never expose EF entities directly to the API. Create DTOs for:

```csharp
// Response DTOs
public record SupporterDto(
    int SupporterId,
    string SupporterType,
    string DisplayName,
    string? OrganizationName,
    string? Email,
    string Status,
    string? AcquisitionChannel,
    decimal TotalDonated,      // Computed from donations
    DateTime? LastDonationDate, // Computed
    double? ChurnRiskScore     // From ML model
);

public record SupporterDetailDto(
    // All supporter fields
    // Plus: List<DonationDto> RecentDonations
    // Plus: DonationSummaryDto Summary
    // Plus: ChurnRiskDto ChurnRisk
);

// Request DTOs
public record CreateSupporterRequest(
    string SupporterType,
    string DisplayName,
    string? OrganizationName,
    string? FirstName,
    string? LastName,
    string RelationshipType,
    string? Region,
    string Country,
    string? Email,
    string? Phone,
    string? AcquisitionChannel
);

// Paginated response wrapper
public record PagedResult<T>(
    IEnumerable<T> Data,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);
```

---

## Data Seeding

On first run, seed the database from the 17 CSV files in `lighthouse_csv_v7/`:

```csharp
public static class DataSeeder
{
    public static async Task SeedAsync(PharosDbContext context, string csvBasePath)
    {
        if (await context.Safehouses.AnyAsync()) return; // Already seeded
        
        // Seed in dependency order:
        // 1. safehouses (no FK dependencies)
        // 2. partners (no FK dependencies)
        // 3. partner_assignments (FK: partners, safehouses)
        // 4. supporters (no FK dependencies)
        // 5. social_media_posts (no FK dependencies)
        // 6. donations (FK: supporters, social_media_posts)
        // 7. in_kind_donation_items (FK: donations)
        // 8. donation_allocations (FK: donations, safehouses)
        // 9. residents (FK: safehouses)
        // 10. process_recordings (FK: residents)
        // 11. home_visitations (FK: residents)
        // 12. education_records (FK: residents)
        // 13. health_wellbeing_records (FK: residents)
        // 14. intervention_plans (FK: residents)
        // 15. incident_reports (FK: residents, safehouses)
        // 16. safehouse_monthly_metrics (FK: safehouses)
        // 17. public_impact_snapshots (no FK dependencies)
        
        // Use CsvHelper for reading
        // Handle nullable fields, date parsing, boolean parsing
        // Use transactions for atomicity
    }
}
```

Also seed Identity users:
```csharp
public static class IdentitySeeder
{
    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        // Create roles
        string[] roles = { "Admin", "Staff", "Donor" };
        foreach (var role in roles)
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        
        // Create admin user (no MFA) — credentials from env/config
        // Create donor user (no MFA) — linked to a supporter_id
        // Create admin with MFA
    }
}
```

---

## ML Model Serving

### Strategy
- Train models in Python (Jupyter notebooks in `ml-pipelines/`)
- Export models as ONNX or pickle files
- In .NET, load models via ML.NET or ONNX Runtime
- Alternatively: host Python models as a separate Flask/FastAPI microservice and call from .NET

### ML Controller
```csharp
[ApiController]
[Route("api/ml")]
[Authorize(Roles = "Admin")]
public class MLController : ControllerBase
{
    private readonly IMLService _mlService;
    
    [HttpGet("donor-churn-risk")]
    public async Task<ActionResult<IEnumerable<DonorChurnRiskDto>>> GetDonorChurnRisks()
    {
        // Returns all supporters with their churn risk scores
    }
    
    [HttpGet("reintegration-readiness/{residentId}")]
    public async Task<ActionResult<ReintegrationReadinessDto>> GetReintegrationReadiness(int residentId)
    {
        // Returns readiness score + contributing factors for one resident
    }
    
    [HttpGet("social-media-recommendations")]
    public async Task<ActionResult<SocialMediaRecommendationDto>> GetPostRecommendations()
    {
        // Returns optimal posting time, content type, platform recommendations
    }
    
    [HttpGet("intervention-effectiveness")]
    public async Task<ActionResult<InterventionEffectivenessDto>> GetInterventionInsights()
    {
        // Returns which interventions have strongest effect on outcomes
    }
}
```

---

## Error Handling

### Global Exception Handler Middleware
```csharp
public class ErrorHandlingMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try { await next(context); }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new { message = ex.Message });
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { message = ex.Message, errors = ex.Errors });
        }
        catch (Exception ex)
        {
            // Log the full exception
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { message = "An error occurred" });
        }
    }
}
```

---

## Connection Strings

Store in `appsettings.json` for development (excluded from git), Azure App Settings for production:

```json
{
  "ConnectionStrings": {
    "PharosDb": "Server=tcp:pharos.database.windows.net,1433;Database=pharos;...",
    "IdentityDb": "Server=tcp:pharos.database.windows.net,1433;Database=pharos_identity;..."
  },
  "Google": {
    "ClientId": "from-env",
    "ClientSecret": "from-env"
  }
}
```

Use `builder.Configuration` which automatically reads from environment variables, user secrets, and appsettings. In Azure, set these as Application Settings.

---

## Deployment

- Azure App Service (Linux) or Docker container on Azure Container Apps
- Azure SQL Database for both PharosDb and IdentityDb
- Environment variables set in Azure Portal → App Settings
- HTTPS provided by Azure with managed certificate
- Configure HSTS in production
