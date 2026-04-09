# Pharos — Master Project Reference

## Mission

Pharos is a full-stack web application for a US-based 501(c)(3) nonprofit that operates safe homes for girls who are survivors of sexual abuse and sex trafficking in the Philippines. The name "Pharos" references the ancient Lighthouse of Alexandria — a beacon of safety and guidance. The app serves three core domains:

1. **Donor & Support** — Retention, growth, campaign effectiveness, connecting donations to real outcomes
2. **Case Management** — Full resident lifecycle from intake through reintegration, counseling documentation, home visits, interventions, incident tracking
3. **Social Media Outreach** — Strategic posting, engagement analytics, and direct correlation between social media activity and donor behavior

This is modeled after [Lighthouse Sanctuary](https://www.lighthousesanctuary.org/), a real nonprofit. The data comes from anonymized operational records they shared.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript 5 + Vite |
| **UI Components** | shadcn/ui (Radix UI + Tailwind CSS v4) |
| **Animation** | Motion (formerly Framer Motion) + Motion Primitives + Animate UI |
| **Charts** | Recharts (or Tremor) |
| **Backend** | .NET 10 / C# |
| **ORM** | Entity Framework Core |
| **Auth** | ASP.NET Identity with cookie-based auth |
| **Database** | Azure SQL Database |
| **Identity DB** | Separate Azure SQL Database (or same server, different schema) |
| **ML Pipelines** | Python (Jupyter notebooks), deployed as .NET API endpoints |
| **Deployment** | Microsoft Azure (App Service or Docker containers) |
| **Source Control** | GitHub (public repo for grading) |

---

## Design System

### Philosophy
Apple-inspired: generous whitespace, subtle depth, micro-interactions everywhere, smooth transitions, typography-driven hierarchy. This is a professional tool that staff will use daily — it must feel premium, not like a generic admin panel.

### Color Palette (CSS Variables)

```css
/* Light Mode */
--background:           hsl(0, 0%, 100%);        /* Pure white */
--foreground:           hsl(240, 10%, 10%);       /* Near-black */
--primary:              hsl(210, 75%, 45%);       /* Clean blue — trust */
--primary-foreground:   hsl(0, 0%, 100%);
--accent:               hsl(38, 92%, 55%);        /* Warm amber — hope */
--accent-foreground:    hsl(0, 0%, 100%);
--muted:                hsl(220, 14%, 96%);       /* Light gray panels */
--muted-foreground:     hsl(220, 8%, 46%);
--card:                 hsl(0, 0%, 100%);         /* White cards */
--card-foreground:      hsl(240, 10%, 10%);
--border:               hsl(220, 13%, 91%);       /* Subtle borders */
--destructive:          hsl(0, 72%, 51%);         /* Red for alerts */
--success:              hsl(142, 71%, 45%);       /* Green for progress */
--warning:              hsl(38, 92%, 50%);        /* Amber for warnings */
--ring:                 hsl(210, 75%, 45%);

/* Dark Mode */
--background:           hsl(224, 20%, 8%);        /* Deep dark */
--foreground:           hsl(0, 0%, 95%);
--card:                 hsl(224, 18%, 12%);       /* Lifted cards */
--card-foreground:      hsl(0, 0%, 95%);
--border:               hsl(224, 14%, 18%);       /* Subtle dividers */
--muted:                hsl(224, 14%, 15%);
--muted-foreground:     hsl(220, 8%, 55%);
--primary:              hsl(210, 80%, 55%);       /* Brighter blue */
--accent:               hsl(38, 92%, 60%);        /* Brighter amber */
```

### Typography
- **Font**: Inter (closest web equivalent to SF Pro)
- **Stat numbers**: Tabular nums, bold, large (text-3xl to text-5xl)
- **Labels**: text-sm, font-medium, muted-foreground
- **Headings**: font-semibold, tracking-tight
- **Body**: text-sm to text-base, leading-relaxed

### Animation Standards (Motion)
- **Page transitions**: Fade + slight Y-translate (duration: 0.3s, ease: easeOut)
- **Card/list enter**: Staggered fade-in (staggerChildren: 0.05)
- **Stat counters**: Spring-animated counting numbers on mount (stiffness: 100, damping: 30)
- **Hover states**: scale(1.02) with spring physics on cards, subtle background shift on rows
- **Button press**: scale(0.97) on tap
- **Sidebar collapse**: Width animation with spring (duration: 0.4s)
- **Modal/sheet**: Spring from trigger point, backdrop blur
- **Chart load**: Draw-in animation, bars grow from zero
- **Skeleton loaders**: Shimmer animation while data loads
- **Toast notifications**: Slide in from top-right with spring, auto-dismiss with fade

### Component Library
- shadcn/ui as the base for all components
- Motion Primitives for pre-built animated variants
- Animate UI for additional animated components
- Custom components follow shadcn conventions (composable, variant-based, Tailwind-styled)

---

## Database Schema (Source of Truth: Actual CSV Headers)

> IMPORTANT: The data dictionary in the case document has some column name differences from the actual CSV files. Always reference these actual headers below.

### Donor & Support Domain

**safehouses** (9 rows)
```
safehouse_id, safehouse_code, name, region, city, province, country, open_date, status, capacity_girls, capacity_staff, current_occupancy, notes
```

**partners** (30 rows)
```
partner_id, partner_name, partner_type, role_type, contact_name, email, phone, region, status, start_date, end_date, notes
```

**partner_assignments** (48 rows)
```
assignment_id, partner_id, safehouse_id, program_area, assignment_start, assignment_end, responsibility_notes, is_primary, status
```

**supporters** (60 rows)
```
supporter_id, supporter_type, display_name, organization_name, first_name, last_name, relationship_type, region, country, email, phone, status, created_at, first_donation_date, acquisition_channel
```
- supporter_type: MonetaryDonor, InKindDonor, Volunteer, SkillsContributor, SocialMediaAdvocate, PartnerOrganization
- acquisition_channel: Website, SocialMedia, Event, WordOfMouth, PartnerReferral, Church

**donations** (420 rows)
```
donation_id, supporter_id, donation_type, donation_date, is_recurring, campaign_name, channel_source, currency_code, amount, estimated_value, impact_unit, notes, referral_post_id
```
- donation_type: Monetary, InKind, Time, Skills, SocialMedia
- channel_source: Campaign, Event, Direct, SocialMedia, PartnerReferral
- campaign_name values: Year-End Hope, Back to School, Summer of Safety, GivingTuesday (nullable)
- NOTE: CSV is missing `created_by_partner_id` that the dictionary mentions

**in_kind_donation_items** (129 rows)
```
item_id, donation_id, item_name, item_category, quantity, unit_of_measure, estimated_unit_value, intended_use, received_condition
```

**donation_allocations** (521 rows)
```
allocation_id, donation_id, safehouse_id, program_area, amount_allocated, allocation_date, allocation_notes
```

### Case Management Domain

**residents** (60 rows)
```
resident_id, case_control_no, internal_code, safehouse_id, case_status, sex, date_of_birth, birth_status, place_of_birth, religion, case_category, sub_cat_orphaned, sub_cat_trafficked, sub_cat_child_labor, sub_cat_physical_abuse, sub_cat_sexual_abuse, sub_cat_osaec, sub_cat_cicl, sub_cat_at_risk, sub_cat_street_child, sub_cat_child_with_hiv, is_pwd, pwd_type, has_special_needs, special_needs_diagnosis, family_is_4ps, family_solo_parent, family_indigenous, family_parent_pwd, family_informal_settler, date_of_admission, age_upon_admission, present_age, length_of_stay, referral_source, referring_agency_person, date_colb_registered, date_colb_obtained, assigned_social_worker, initial_case_assessment, date_case_study_prepared, reintegration_type, reintegration_status, initial_risk_level, current_risk_level, date_enrolled, date_closed, created_at, notes_restricted
```
- case_status: Active, Closed, Transferred
- case_category: Abandoned, Foundling, Surrendered, Neglected
- initial_risk_level / current_risk_level: Low, Medium, High, Critical
- reintegration_type: Family Reunification, Foster Care, Adoption (Domestic), Adoption (Inter-Country), Independent Living, None
- reintegration_status: Not Started, In Progress, Completed, On Hold

**process_recordings** (2,819 rows — largest table)
```
recording_id, resident_id, session_date, social_worker, session_type, session_duration_minutes, emotional_state_observed, emotional_state_end, session_narrative, interventions_applied, follow_up_actions, progress_noted, concerns_flagged, referral_made, notes_restricted
```
- session_type: Individual, Group
- emotional states: Calm, Anxious, Sad, Angry, Hopeful, Withdrawn, Happy, Distressed

**home_visitations** (1,337 rows)
```
visitation_id, resident_id, visit_date, social_worker, visit_type, location_visited, family_members_present, purpose, observations, family_cooperation_level, safety_concerns_noted, follow_up_needed, follow_up_notes, visit_outcome
```
- visit_type: Initial Assessment, Routine Follow-Up, Reintegration Assessment, Post-Placement Monitoring, Emergency
- family_cooperation_level: Highly Cooperative, Cooperative, Neutral, Uncooperative
- visit_outcome: Favorable, Needs Improvement, Unfavorable, Inconclusive

**education_records** (534 rows)
```
education_record_id, resident_id, record_date, education_level, school_name, enrollment_status, attendance_rate, progress_percent, completion_status, notes
```
- NOTE: CSV differs from dictionary — has `school_name` and `enrollment_status` instead of `program_name`, `course_name`, `attendance_status`, `gpa_like_score`
- education_level: Primary, Secondary, Vocational, CollegePrep
- completion_status: NotStarted, InProgress, Completed

**health_wellbeing_records** (534 rows)
```
health_record_id, resident_id, record_date, general_health_score, nutrition_score, sleep_quality_score, energy_level_score, height_cm, weight_kg, bmi, medical_checkup_done, dental_checkup_done, psychological_checkup_done, notes
```
- NOTE: CSV uses `sleep_quality_score` (not `sleep_score`), `energy_level_score` (not `energy_score`), `notes` (not `medical_notes_restricted`)
- Scores are on 1.0-5.0 scale

**intervention_plans** (180 rows)
```
plan_id, resident_id, plan_category, plan_description, services_provided, target_value, target_date, status, case_conference_date, created_at, updated_at
```
- plan_category: Safety, Psychosocial, Education, Physical Health, Legal, Reintegration
- status: Open, In Progress, Achieved, On Hold, Closed

**incident_reports** (100 rows)
```
incident_id, resident_id, safehouse_id, incident_date, incident_type, severity, description, response_taken, resolved, resolution_date, reported_by, follow_up_required
```
- incident_type: Behavioral, Medical, Security, RunawayAttempt, SelfHarm, ConflictWithPeer, PropertyDamage
- severity: Low, Medium, High

### Outreach & Communication Domain

**social_media_posts** (812 rows)
```
post_id, platform, platform_post_id, post_url, created_at, day_of_week, post_hour, post_type, media_type, caption, hashtags, num_hashtags, mentions_count, has_call_to_action, call_to_action_type, content_topic, sentiment_tone, caption_length, features_resident_story, campaign_name, is_boosted, boost_budget_php, impressions, reach, likes, comments, shares, saves, click_throughs, video_views, engagement_rate, profile_visits, donation_referrals, estimated_donation_value_php, follower_count_at_post, watch_time_seconds, avg_view_duration_seconds, subscriber_count_at_post, forwards
```
- platform: Facebook, Instagram, Twitter, TikTok, LinkedIn, YouTube, WhatsApp
- post_type: ImpactStory, Campaign, EventPromotion, ThankYou, EducationalContent, FundraisingAppeal
- media_type: Photo, Video, Carousel, Text, Reel
- content_topic: Education, Health, Reintegration, DonorImpact, SafehouseLife, EventRecap, CampaignLaunch, Gratitude, AwarenessRaising
- sentiment_tone: Hopeful, Urgent, Celebratory, Informative, Grateful, Emotional
- call_to_action_type: DonateNow, LearnMore, ShareStory, SignUp

**safehouse_monthly_metrics** (450 rows)
```
metric_id, safehouse_id, month_start, month_end, active_residents, avg_education_progress, avg_health_score, process_recording_count, home_visitation_count, incident_count, notes
```

**public_impact_snapshots** (50 rows)
```
snapshot_id, snapshot_date, headline, summary_text, metric_payload_json, is_published, published_at
```

---

## Project Structure

```
Pharos/
├── CLAUDE.md                          # This file
├── agents/                            # Agent-specific instruction files
│   ├── frontend-agent.md
│   ├── backend-agent.md
│   ├── security-agent.md
│   ├── social-media-agent.md
│   └── ml-pipeline-agent.md
├── lighthouse_csv_v7/                 # Source data (17 CSVs)
├── ml-pipelines/                      # Jupyter notebooks for ML
│   ├── donor-churn-predictor.ipynb
│   ├── social-media-optimizer.ipynb
│   ├── reintegration-readiness.ipynb
│   └── intervention-effectiveness.ipynb
├── frontend/                          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn components
│   │   │   ├── layout/                # Sidebar, Header, PageTransition
│   │   │   ├── dashboard/             # Dashboard-specific widgets
│   │   │   ├── donors/                # Donor management components
│   │   │   ├── cases/                 # Case management components
│   │   │   ├── social/                # Social media command center
│   │   │   └── shared/                # Reusable app components
│   │   ├── pages/                     # Route-level page components
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── lib/                       # Utilities, API client, auth
│   │   ├── types/                     # TypeScript interfaces
│   │   └── styles/                    # Global styles, theme
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                           # .NET 10 API
│   ├── Controllers/
│   ├── Models/                        # EF entity classes
│   ├── Data/                          # DbContext, migrations
│   ├── Services/                      # Business logic, social media services
│   ├── ML/                            # ML model loading and prediction endpoints
│   ├── Middleware/                     # CSP, error handling
│   ├── DTOs/                          # Data transfer objects
│   ├── Program.cs
│   ├── appsettings.json
│   └── backend.csproj
├── .env                               # Secrets (NOT committed)
├── .gitignore
└── README.md
```

---

## Coding Standards

### Frontend (React/TypeScript)
- Functional components only, no class components
- Custom hooks for shared logic (e.g., `useAuth`, `useDonors`, `useResidents`)
- All API calls go through a centralized API client (`lib/api.ts`) with interceptors for auth tokens
- TypeScript strict mode — no `any` types
- Component files: PascalCase (`DonorTable.tsx`)
- Hook files: camelCase with `use` prefix (`useDonors.ts`)
- Page components map 1:1 with routes
- All data tables use TanStack Table (via shadcn DataTable) with server-side pagination
- Forms use React Hook Form + Zod validation
- Toast notifications via shadcn `Sonner`
- All animations use Motion — never raw CSS transitions for interactive elements

### Backend (.NET/C#)
- Controller-Service pattern: Controllers handle HTTP, Services handle business logic
- Entity Framework Core with code-first migrations
- DTOs for all API responses — never expose EF entities directly
- Async/await everywhere
- Repository pattern optional (EF DbContext is already a unit of work)
- Use `[Authorize]` and `[Authorize(Roles = "Admin")]` attributes on all protected endpoints
- Return consistent API response shapes: `{ data, message, errors }`
- All currency values stored as decimal, always in PHP (Philippine Pesos)

### Naming Conventions
- Database columns: snake_case (matching CSVs)
- C# properties: PascalCase (EF maps automatically)
- TypeScript interfaces: PascalCase with `I` prefix optional (prefer without)
- API endpoints: kebab-case (`/api/process-recordings`)
- React components: PascalCase
- CSS classes: Tailwind utilities only, no custom CSS classes unless absolutely necessary

---

## Authentication & Authorization

### Roles
| Role | Access |
|---|---|
| **Admin** | Full CRUD on all data, user management, all dashboards |
| **Staff** | Read all data, create/update (no delete), case management features |
| **Donor** | View their own donation history and personalized impact dashboard |
| **Unauthenticated** | Landing page, public impact dashboard, privacy policy, login |

### Auth Flow
1. ASP.NET Identity with cookie auth (not JWT — simpler for same-origin SPA)
2. React calls `/api/auth/login` with credentials, receives httpOnly cookie
3. `/api/auth/me` returns current user info + roles
4. React auth context wraps the app, redirects unauthenticated users
5. All `/api/admin/*` endpoints require Admin role
6. All `/api/staff/*` endpoints require Staff or Admin role
7. `/api/donor/*` endpoints require Donor role, scoped to their supporter_id
8. `/api/public/*` endpoints are open (landing page data, impact snapshots)

### Password Policy (per class instruction — length-only)
- Minimum 14 characters (better than default 6)
- No uppercase/lowercase/digit/special requirements
- No common passwords (maintain a blocklist)
- No part of username/email in password

### Third-Party Auth
- Google OAuth as additional login option
- MFA via TOTP (authenticator app) — required for Admin accounts, optional for others
- Must have test accounts WITHOUT MFA for grading

---

## API Structure

```
/api/auth/
  POST   /login
  POST   /register
  POST   /logout
  GET    /me
  POST   /google-login

/api/public/
  GET    /impact-snapshots
  GET    /impact-snapshots/:id
  GET    /safehouses/summary          # Anonymized safehouse stats

/api/donor/
  GET    /my-profile
  GET    /my-donations
  GET    /my-impact                   # Personalized impact journey

/api/admin/
  # Safehouses
  GET    /safehouses
  GET    /safehouses/:id
  PUT    /safehouses/:id
  POST   /safehouses

  # Supporters & Donations
  GET    /supporters
  GET    /supporters/:id
  POST   /supporters
  PUT    /supporters/:id
  DELETE /supporters/:id
  GET    /donations
  GET    /donations/:id
  POST   /donations
  PUT    /donations/:id
  DELETE /donations/:id
  GET    /donation-allocations
  POST   /donation-allocations

  # Residents (Case Management)
  GET    /residents
  GET    /residents/:id
  POST   /residents
  PUT    /residents/:id
  DELETE /residents/:id
  GET    /residents/:id/summary       # Aggregated case conference prep

  # Process Recordings
  GET    /process-recordings
  GET    /process-recordings/:id
  POST   /process-recordings
  PUT    /process-recordings/:id
  GET    /residents/:id/process-recordings

  # Home Visitations
  GET    /home-visitations
  POST   /home-visitations
  PUT    /home-visitations/:id
  GET    /residents/:id/home-visitations

  # Education, Health, Interventions, Incidents
  GET    /education-records
  POST   /education-records
  PUT    /education-records/:id
  GET    /health-records
  POST   /health-records
  PUT    /health-records/:id
  GET    /intervention-plans
  POST   /intervention-plans
  PUT    /intervention-plans/:id
  GET    /incident-reports
  POST   /incident-reports
  PUT    /incident-reports/:id
  DELETE /incident-reports/:id

  # Social Media
  GET    /social-media/posts
  GET    /social-media/analytics
  POST   /social-media/compose        # Create + schedule posts via APIs
  POST   /social-media/comments/:id/reply
  GET    /social-media/comments/inbox  # Unified comment feed

  # Reports & Analytics
  GET    /reports/donations            # Donation trends
  GET    /reports/outcomes             # Resident outcomes
  GET    /reports/safehouses           # Safehouse comparisons
  GET    /reports/social-media         # Social media effectiveness

  # ML Predictions
  GET    /ml/donor-churn-risk
  GET    /ml/reintegration-readiness/:residentId
  GET    /ml/social-media-recommendations
  GET    /ml/intervention-effectiveness

  # Partners
  GET    /partners
  POST   /partners
  PUT    /partners/:id
```

---

## ML Pipelines Overview

### Pipeline 1: Donor Churn Predictor (Predictive)
- **Question**: Which donors are at risk of lapsing?
- **Tables**: supporters, donations, donation_allocations
- **Target**: Binary — will donor give again within 6 months?
- **Features**: Donation frequency, recency, amount trends, acquisition channel, recurring status, campaign participation
- **Deployment**: Risk score per supporter on admin dashboard, alert cards for at-risk donors

### Pipeline 2: Social Media Optimizer (Explanatory + Predictive)
- **Question**: What post characteristics drive donations vs. just engagement?
- **Tables**: social_media_posts, donations (via referral_post_id)
- **Explanatory**: OLS regression on donation_referrals to identify causal drivers
- **Predictive**: Predict engagement_rate and donation_referrals for new posts
- **Deployment**: Recommendations in Social Media Command Center (best time, content type, platform)

### Pipeline 3: Reintegration Readiness Score (Predictive)
- **Question**: When is a resident ready for reintegration?
- **Tables**: residents, process_recordings, education_records, health_wellbeing_records, intervention_plans, home_visitations
- **Target**: Predict reintegration_status progression
- **Features**: Health score trends, education progress, emotional state trajectories, home visitation outcomes, intervention plan completion
- **Deployment**: Readiness score on each resident's profile card

### Pipeline 4: Intervention Effectiveness (Explanatory)
- **Question**: Which interventions actually improve outcomes?
- **Tables**: intervention_plans, process_recordings, health_wellbeing_records, education_records, incident_reports
- **Method**: OLS regression + feature importance analysis
- **Deployment**: Insights panel in case conference prep view, recommendations during intervention planning

---

## Security Checklist

See `agents/security-agent.md` for full details. Summary:

- [ ] HTTPS with valid TLS certificate (Azure provides)
- [ ] HTTP → HTTPS redirect
- [ ] ASP.NET Identity with custom PasswordOptions
- [ ] Cookie-based auth with httpOnly, Secure, SameSite
- [ ] RBAC: Admin, Staff, Donor, Unauthenticated
- [ ] `[Authorize]` on all CUD endpoints
- [ ] Delete confirmation required (frontend AlertDialog)
- [ ] Credentials in .env / Azure App Settings (never in code)
- [ ] GDPR privacy policy page (footer link)
- [ ] Cookie consent banner (fully functional, not cosmetic)
- [ ] Content-Security-Policy HTTP header (not meta tag)
- [ ] Google OAuth (third-party auth)
- [ ] TOTP MFA (authenticator app)
- [ ] HSTS header
- [ ] Dark/light mode cookie (browser-accessible, not httpOnly)
- [ ] Input sanitization / output encoding
- [ ] Both databases deployed to Azure SQL (not SQLite)

---

## Key Differentiators

1. **Social Media Command Center** — Live API integration for posting and comment management across Facebook, Instagram, LinkedIn, YouTube, TikTok, Twitter from within the app
2. **ML-Powered Risk Alerts** — Real-time dashboard flags for at-risk residents and lapsing donors
3. **Donor Impact Journey** — Personalized portal connecting donations to anonymized outcomes
4. **Apple-Quality UI** — Motion animations, spring physics, animated counters, dark mode, skeleton loaders — not a generic admin template
5. **Case Conference Auto-Summary** — One-click aggregated resident status pulling from all data sources
6. **Social → Donation Attribution** — Visual correlation between post performance and actual donation referrals

---

## Grading Accounts (Required for Submission)

Seed the following accounts during deployment:

1. **Admin (no MFA)**: `admin@pharos.org` / [strong password in .env]
2. **Donor (no MFA)**: `donor@pharos.org` / [strong password in .env] — linked to a supporter_id with donation history
3. **Admin with MFA**: `admin-mfa@pharos.org` / [strong password in .env] — TOTP enabled

---

## Currency

All monetary values are in **Philippine Pesos (PHP)**. Display with peso sign: `₱1,234.56`. Use `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })` in the frontend.
