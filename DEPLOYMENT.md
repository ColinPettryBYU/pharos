# Pharos — Deployment Guide

## Architecture

```
[Vercel] ──HTTPS──> React Frontend (frontend/)
    │
    │ API calls to
    ▼
[Azure App Service] ──> .NET 10 API (backend/)
    │
    │ EF Core (Npgsql)
    ▼
[Supabase] ──> PostgreSQL Database
    ├── pharos schema (operational data - 17 tables)
    └── identity schema (ASP.NET Identity tables)
```

## 1. Supabase Setup (Database)

### Create Project
1. Go to https://supabase.com and create a free account
2. Create a new project — name it `pharos`
3. Choose a strong database password and save it
4. Select the closest region (e.g., US East)
5. Wait for project to provision (~2 minutes)

### Get Connection String
1. Go to Project Settings → Database
2. Copy the **Connection string (URI)** — it looks like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
3. For Entity Framework, use this format in your .env:
   ```
   PHAROS_DB_CONNECTION=Host=aws-0-us-east-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.[project-ref];Password=[your-password];SSL Mode=Require;Trust Server Certificate=true
   ```

### Notes
- Free tier: 500MB storage, 2 GB bandwidth — more than enough for this project
- Both operational and identity tables will live in the same Supabase PostgreSQL instance (separate schemas if desired, but same DB is fine)
- EF Core migrations will create all tables automatically on first run
- Supabase dashboard lets you browse tables directly (useful for debugging)

## 2. Azure App Service Setup (Backend)

### Create Resources
```bash
# Login
az login

# Create resource group
az group create --name pharos-rg --location eastus

# Create App Service plan (free tier for students)
az appservice plan create --name pharos-plan --resource-group pharos-rg --sku B1 --is-linux

# Create web app
az webapp create \
  --name pharos-api \
  --resource-group pharos-rg \
  --plan pharos-plan \
  --runtime "DOTNET|10.0"
```

### Configure Environment Variables
```bash
az webapp config appsettings set --name pharos-api --resource-group pharos-rg --settings \
  ConnectionStrings__PharosDb="Host=...;Port=6543;Database=postgres;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true" \
  Google__ClientId="your-google-client-id" \
  Google__ClientSecret="your-google-client-secret" \
  ASPNETCORE_ENVIRONMENT="Production" \
  AllowedOrigins="https://pharos.vercel.app"
```

### Deploy
Option A — GitHub Actions (recommended):
```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend
on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'
      - run: dotnet publish backend/ -c Release -o ./publish
      - uses: azure/webapps-deploy@v3
        with:
          app-name: pharos-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./publish
```

Option B — Direct deploy:
```bash
cd backend
dotnet publish -c Release -o ./publish
cd publish
zip -r ../deploy.zip .
az webapp deploy --name pharos-api --resource-group pharos-rg --src-path ../deploy.zip --type zip
```

### HTTPS & HSTS
- Azure App Service provides HTTPS automatically with `*.azurewebsites.net` certificate
- Enable "HTTPS Only" in Azure Portal: Settings → TLS/SSL → HTTPS Only = On
- This handles the HTTP → HTTPS redirect requirement
- HSTS is configured in Program.cs (`app.UseHsts()` in production)

## 3. Vercel Setup (Frontend)

### Connect Repository
1. Go to https://vercel.com and sign in with GitHub
2. Import your repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Environment Variables (in Vercel dashboard)
```
VITE_API_URL=https://pharos-api.azurewebsites.net/api
```

### vercel.json (in frontend/)
Already created — handles SPA routing (all routes → index.html) and API proxy for development.

### Custom Domain (Optional)
- Vercel provides `pharos.vercel.app` by default
- Can add custom domain in Vercel dashboard

## 4. CORS Configuration

The .NET backend must allow requests from the Vercel frontend:

```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",                    // Vite dev server
            "https://pharos.vercel.app",               // Production frontend
            builder.Configuration["AllowedOrigins"]!   // Configurable
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();  // Required for cookie auth
    });
});
```

### Cookie Auth Cross-Origin Notes
Since frontend (Vercel) and backend (Azure) are on different domains, cookie auth needs special handling:

```csharp
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.None;  // Required for cross-origin
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.HttpOnly = true;
});
```

**IMPORTANT**: `SameSite=None` requires `Secure=true` (HTTPS). This works because both Vercel and Azure serve over HTTPS.

## 5. Database Migration & Seeding

### First Deployment
```bash
cd backend

# Create migration
dotnet ef migrations add InitialCreate

# Apply migration (uses connection string from env)
dotnet ef database update

# Seeding happens automatically on startup via DataSeeder
```

### The seeder in Program.cs:
```csharp
// After app.Build(), before app.Run():
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<PharosDbContext>();
    await context.Database.MigrateAsync();
    
    var csvPath = Path.Combine(app.Environment.ContentRootPath, "lighthouse_csv_v7");
    await DataSeeder.SeedAsync(context, csvPath);
    
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    await IdentitySeeder.SeedAsync(userManager, roleManager);
}
```

### Include CSV files in publish
Add to `backend.csproj`:
```xml
<ItemGroup>
  <None Include="../lighthouse_csv_v7/**" CopyToOutputDirectory="PreserveNewest" LinkBase="lighthouse_csv_v7" />
</ItemGroup>
```

## 6. Grading Accounts

These are seeded automatically by IdentitySeeder:

| Account | Email | MFA | Role | Notes |
|---|---|---|---|---|
| Admin (no MFA) | admin@pharos.org | No | Admin | Full access for grading |
| Donor (no MFA) | donor@pharos.org | No | Donor | Linked to supporter with donation history |
| Admin (MFA) | admin-mfa@pharos.org | TOTP | Admin | Demonstrates MFA works |

Passwords stored in environment variables, never in code.

## 7. Pre-Submission Checklist

- [ ] Frontend deployed to Vercel and accessible
- [ ] Backend deployed to Azure App Service and accessible
- [ ] Database seeded with all 17 tables of data
- [ ] HTTPS working on both frontend and backend
- [ ] HTTP redirects to HTTPS on backend
- [ ] CORS allows Vercel origin
- [ ] Cookie auth works cross-origin
- [ ] All 3 grading accounts work
- [ ] CSP header present in responses
- [ ] Privacy policy page accessible
- [ ] Cookie consent banner functional
- [ ] GitHub repo set to Public
- [ ] No credentials in GitHub repo
- [ ] ML model predictions returning from API
- [ ] All admin CRUD operations working
- [ ] Delete confirmation dialogs working
- [ ] Dark/light mode toggle working with cookie persistence

## 8. Useful Commands

```bash
# Check Azure app logs
az webapp log tail --name pharos-api --resource-group pharos-rg

# Restart Azure app
az webapp restart --name pharos-api --resource-group pharos-rg

# Check Vercel deployment
vercel ls

# Test API health
curl https://pharos-api.azurewebsites.net/api/public/impact-snapshots
```
