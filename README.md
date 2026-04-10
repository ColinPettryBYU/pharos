# Pharos — Lighthouse Sanctuary Management Platform

Pharos is a full-stack web application built for a US-based 501(c)(3) nonprofit operating safe homes for girls who are survivors of sexual abuse and sex trafficking in the Philippines. Named after the ancient Lighthouse of Alexandria, Pharos serves as a beacon of safety — connecting donors to real impact, streamlining case management, and optimizing outreach.

**Live Site:** [https://pharos-snowy.vercel.app](https://pharos-snowy.vercel.app)

---

## Features

### Donor & Support
- Donation tracking with campaign attribution and recurring donation support
- Personalized donor impact dashboard connecting donations to anonymized outcomes
- ML-powered donor churn risk predictions to flag at-risk supporters
- In-kind donation itemization and allocation tracking across safehouses
- AI bot powered by database

### Case Management
- Full resident lifecycle from intake through reintegration
- Chronological process recordings with social worker session notes
- Home visitation tracking with family cooperation and safety assessments
- Education, health, and wellbeing monitoring with longitudinal trends
- Intervention plan management with ML-driven effectiveness analysis
- Incident reporting with severity tracking and resolution workflows
- Reintegration readiness scoring powered by machine learning

### Social Media Command Center
- Cross-platform post analytics (Facebook, Instagram, Twitter, TikTok, LinkedIn, YouTube)
- ML-powered posting recommendations (best time, content type, platform)
- Direct correlation between social media activity and donation referrals
- Engagement rate prediction for planned posts
<<<<<<< HEAD
=======
- API integration into each social platform for automated posting.
>>>>>>> 5cb6a50d0efc7980de1029c6e611824ab07173ef

### ML Pipelines
- **Donor Churn Predictor** — Identifies supporters at risk of lapsing based on donation patterns
- **Reintegration Readiness** — Scores residents on readiness for family reunification or independent living
- **Social Media Optimizer** — Recommends optimal posting strategies for engagement and donation conversion
- **Intervention Effectiveness** — OLS regression analysis identifying which factors drive resident improvement
- **Resident Risk Predictor** — Flags elevated-risk residents based on incident history and case trajectory

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5, Vite |
| UI | shadcn/ui (Radix UI + Tailwind CSS v4) |
| Animation | Motion (Framer Motion) |
| Charts | Recharts |
| Backend | .NET 10 / C# |
| ORM | Entity Framework Core |
<<<<<<< HEAD
| Auth | ASP.NET Identity (cookie-based) + Google OAuth + TOTP MFA |
=======
| Auth | ASP.NET Identity (cookie-based) + Google OAuth  |
>>>>>>> 5cb6a50d0efc7980de1029c6e611824ab07173ef
| Database | PostgreSQL (Supabase) |
| ML Pipelines | Python (Jupyter, scikit-learn, statsmodels) |
| ML Automation | GitHub Actions (scheduled + manual triggers) |
| Frontend Hosting | Vercel |
| Backend Hosting | Azure App Service |

---

## Project Structure

```
Pharos/
├── frontend/            # React + Vite SPA
│   ├── src/
│   │   ├── components/  # UI components (shadcn, layout, domain-specific)
│   │   ├── pages/       # Route-level page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # API client, utilities, auth
│   │   └── types/       # TypeScript interfaces
│   └── public/
├── backend/             # .NET 10 Web API
│   ├── Controllers/     # API endpoints
│   ├── Models/          # EF Core entities
│   ├── Data/            # DbContext, migrations, seeder
│   ├── Services/        # Business logic, ML service
│   ├── DTOs/            # Data transfer objects
│   └── Middleware/      # CSP, error handling
├── ml-pipelines/        # Python ML notebooks and jobs
│   ├── jobs/            # ETL, train, inference scripts per pipeline
│   ├── artifacts/       # Trained models and feature files
│   └── outputs/         # Pipeline output CSVs
├── lighthouse_csv_v7/   # Source CSV data (17 tables)
└── .github/workflows/   # CI/CD and ML pipeline automation
```

---

## Authentication & Roles

| Role | Access |
|---|---|
| Admin | Full CRUD, user management, all dashboards, ML analytics |
| Staff | Read all data, create/update, case management features |
| Donor | Personal donation history, personalized impact dashboard |
| Unauthenticated | Landing page, public impact dashboard, privacy policy |

- Cookie-based authentication with httpOnly, Secure, SameSite attributes
- Google OAuth for third-party login
<<<<<<< HEAD
- TOTP MFA (authenticator app) support
=======
>>>>>>> 5cb6a50d0efc7980de1029c6e611824ab07173ef
- 24-hour session expiration
- Minimum 14-character password with complexity requirements

---

## ML Pipeline Automation

ML pipelines run via GitHub Actions on a scheduled basis and can be triggered manually:

- **`ml-pipeline.yml`** — Runs donor churn, reintegration readiness, intervention effectiveness, and resident risk pipelines
- **`social-insights.yml`** — Runs social media optimization pipeline

Each pipeline follows an ETL → Train → Inference pattern, reading from the live database and writing predictions back.

---

## Security

- HTTPS with TLS (Azure + Vercel)
- Content-Security-Policy headers
- HSTS with preload
- RBAC on all API endpoints
- Input sanitization and output encoding
- GDPR privacy policy page
- Cookie consent banner
- Credentials stored in environment variables (never in code)

---

## Test Accounts

| Role | Email | Notes |
|---|---|---|
| Admin | admin@pharos.org | No MFA |
<<<<<<< HEAD
| Admin + MFA | admin-mfa@pharos.org | TOTP enabled |
=======
>>>>>>> 5cb6a50d0efc7980de1029c6e611824ab07173ef
| Donor | donor@pharos.org | Linked to supporter with donation history |

---

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
dotnet restore
dotnet run
```

### Environment Variables
Copy `.env.example` to `.env` and populate with your database connection string, Google OAuth credentials, and Gemini API key.

---

## Currency

All monetary values are in Philippine Pesos (PHP), displayed as ₱1,234.56.
