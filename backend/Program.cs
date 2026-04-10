
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.Data;
using Pharos.Api.Middleware;
using Pharos.Api.Models;
using Pharos.Api.Services;
using Pharos.Api.Services.PlatformClients;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// ── Database Contexts ──
builder.Services.AddDbContext<PharosDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PharosDb")));

builder.Services.AddDbContext<PharosIdentityDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("IdentityDb")));

// ── ASP.NET Identity ──
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password policy: length-only (better than default 6-char minimum)
    options.Password.RequiredLength = 14;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredUniqueChars = 1;

    // Account lockout
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<PharosIdentityDbContext>()
.AddDefaultTokenProviders()
.AddPasswordValidator<CommonPasswordValidator<ApplicationUser>>();

// ── Cookie Authentication ──
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.None; // None required for cross-origin (Vercel→Azure)
    options.Cookie.Name = "Pharos.Auth";
    options.ExpireTimeSpan = TimeSpan.FromHours(24);
    options.SlidingExpiration = true;

    // Return 401/403 JSON instead of redirecting to a login page
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

// ── Data Protection (persist keys so OAuth correlation cookies survive app restarts) ──
var dpKeysDir = builder.Environment.IsProduction()
    ? "/home/dp-keys"
    : Path.Combine(builder.Environment.ContentRootPath, "dp-keys");
Directory.CreateDirectory(dpKeysDir);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeysDir))
    .SetApplicationName("Pharos");

// Configure external auth cookie (used during Google OAuth flow)
builder.Services.ConfigureExternalCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.None;
});

// ── Google OAuth (placeholder — configure secrets in Azure App Settings) ──
var googleClientId = builder.Configuration["Google:ClientId"];
var googleClientSecret = builder.Configuration["Google:ClientSecret"];
if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle(options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.CorrelationCookie.SameSite = SameSiteMode.None;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
            options.CorrelationCookie.HttpOnly = true;

            options.Events.OnRemoteFailure = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("GoogleOAuth");
                logger.LogError(context.Failure,
                    "Google OAuth remote failure: {Message}", context.Failure?.Message);

                var frontendUrl = builder.Configuration["FrontendUrl"]
                    ?? builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()?.FirstOrDefault()
                    ?? "https://pharos-snowy.vercel.app";

                context.Response.Redirect(
                    $"{frontendUrl}/login?error=google-failed&detail={Uri.EscapeDataString(context.Failure?.Message ?? "unknown")}");
                context.HandleResponse();
                return Task.CompletedTask;
            };
        });
}
else
{
    var startupLogger = LoggerFactory.Create(b => b.AddConsole()).CreateLogger("Startup");
    startupLogger.LogWarning(
        "Google OAuth NOT configured. ClientId present: {HasId}, ClientSecret present: {HasSecret}",
        !string.IsNullOrEmpty(googleClientId), !string.IsNullOrEmpty(googleClientSecret));
}

// ── CORS ──
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? Array.Empty<string>();
        policy.WithOrigins(
                new[] {
                    "http://localhost:5173",
                    "http://localhost:3000",
                }.Concat(allowedOrigins).ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ── HSTS ──
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});

// ── Application Services ──
builder.Services.AddScoped<ISafehouseService, SafehouseService>();
builder.Services.AddScoped<IDonorService, DonorService>();
builder.Services.AddScoped<IResidentService, ResidentService>();
builder.Services.AddScoped<ISocialMediaService, SocialMediaService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IPartnerService, PartnerService>();
builder.Services.AddScoped<IMLService, MLService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddHttpClient<IChatService, ChatService>();

// ── Social Media Platform Clients ──
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ITokenEncryptionService, TokenEncryptionService>();
builder.Services.AddHttpClient<FacebookClient>();
builder.Services.AddHttpClient<InstagramClient>();
builder.Services.AddHttpClient<LinkedInClient>();
builder.Services.AddHttpClient<YouTubeClient>();
builder.Services.AddHttpClient<TikTokClient>();
builder.Services.AddHttpClient<TwitterClient>();
builder.Services.AddScoped<ISocialPlatformClient, FacebookClient>();
builder.Services.AddScoped<ISocialPlatformClient, InstagramClient>();
builder.Services.AddScoped<ISocialPlatformClient, LinkedInClient>();
builder.Services.AddScoped<ISocialPlatformClient, YouTubeClient>();
builder.Services.AddScoped<ISocialPlatformClient, TikTokClient>();
builder.Services.AddScoped<ISocialPlatformClient, TwitterClient>();
builder.Services.AddScoped<IPlatformClientFactory, PlatformClientFactory>();
builder.Services.AddScoped<ISocialCredentialService, SocialCredentialService>();

// ── Controllers & Swagger ──
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Pharos API",
        Version = "v1",
        Description = "Backend API for the Pharos nonprofit safehouse management platform."
    });
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

// ── Middleware Pipeline ──

// Forwarded headers — must be first so HTTPS detection works behind Azure proxy
app.UseForwardedHeaders();

// Error handling
app.UseMiddleware<ErrorHandlingMiddleware>();

// HTTPS redirect and HSTS
if (app.Environment.IsProduction())
{
    app.UseHsts();
}
app.UseHttpsRedirection();

// Security headers (CSP, X-Content-Type-Options, etc.)
app.UseMiddleware<SecurityHeadersMiddleware>();

// Swagger — available in development only
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS
app.UseCors("Frontend");

// Auth
app.UseAuthentication();
app.UseAuthorization();

// Controllers
app.MapControllers();

// ── Database Initialization & Seeding ──
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        // Apply migrations
        var pharosDb = services.GetRequiredService<PharosDbContext>();
        await pharosDb.Database.MigrateAsync();
        logger.LogInformation("PharosDb migrations applied.");

        var identityDb = services.GetRequiredService<PharosIdentityDbContext>();
        await identityDb.Database.MigrateAsync();
        logger.LogInformation("IdentityDb migrations applied.");

        // Seed data from CSVs — check both publish layout (wwwroot/lighthouse_csv_v7)
        // and dev layout (../lighthouse_csv_v7 relative to backend/)
        var csvPath = Path.Combine(app.Environment.ContentRootPath, "lighthouse_csv_v7");
        if (!Directory.Exists(csvPath))
            csvPath = Path.Combine(app.Environment.ContentRootPath, "..", "lighthouse_csv_v7");
        if (Directory.Exists(csvPath))
        {
            await DataSeeder.SeedAsync(pharosDb, csvPath, logger);
        }
        else
        {
            logger.LogWarning("CSV directory not found. Tried both publish and dev paths. Skipping data seeding.");
        }

        // Seed ML prediction tables from notebook-exported CSVs
        var mlDir = Path.Combine(app.Environment.ContentRootPath, "ml-pipelines");
        if (!Directory.Exists(mlDir))
            mlDir = Path.Combine(app.Environment.ContentRootPath, "..", "ml-pipelines");
        if (Directory.Exists(mlDir))
        {
            await DataSeeder.SeedMLPredictionsAsync(pharosDb, mlDir, logger);
        }
        else
        {
            logger.LogWarning("ML pipelines directory not found. Tried both publish and dev paths. Skipping ML seeding.");
        }

        // Seed Identity users
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var config = services.GetRequiredService<IConfiguration>();
        await IdentitySeeder.SeedAsync(userManager, roleManager, config, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database initialization.");
    }
}

app.Run();
