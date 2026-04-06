# Frontend Agent — Pharos

> Reference `CLAUDE.md` for project context, database schema, API structure, and design system.

You are responsible for building the entire React + TypeScript frontend for Pharos. The UI must feel premium — Apple-level polish with smooth animations, generous whitespace, and thoughtful micro-interactions. This is not a generic admin template. Every interaction should feel intentional and fluid.

---

## Tech Setup

```bash
# Initialize
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Core UI
npx shadcn@latest init        # Choose: New York style, Slate, CSS variables: yes
npx shadcn@latest add button card input label select textarea dialog alert-dialog sheet tabs badge avatar separator skeleton switch dropdown-menu command popover calendar form toast sonner table tooltip sidebar breadcrumb

# Animation
npm install motion             # Formerly framer-motion — THE animation library
# Also install Motion Primitives components as needed (copy-paste from motionprimitives.com)
# Also install Animate UI components as needed (copy-paste from animate-ui.com)

# Data & Forms
npm install @tanstack/react-table @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install recharts            # Charts

# Routing
npm install react-router-dom

# Utilities
npm install clsx tailwind-merge lucide-react
npm install date-fns            # Date formatting
```

---

## Routing Structure

```tsx
// Public routes (no auth required)
/                          → LandingPage
/impact                    → PublicImpactDashboard
/login                     → LoginPage
/register                  → RegisterPage
/privacy                   → PrivacyPolicyPage

// Donor routes (Donor role required)
/donor/dashboard           → DonorDashboard (personalized impact journey)
/donor/donations           → DonorDonationHistory

// Admin/Staff routes (Admin or Staff role required)
/admin                     → AdminDashboard
/admin/donors              → DonorsPage (list + CRUD)
/admin/donors/:id          → DonorDetailPage
/admin/donations           → DonationsPage (list + CRUD)
/admin/residents           → CaseloadInventoryPage
/admin/residents/:id       → ResidentDetailPage (tabbed: overview, recordings, visits, education, health, interventions, incidents)
/admin/process-recordings  → ProcessRecordingsPage (list + create)
/admin/home-visitations    → HomeVisitationsPage (list + create)
/admin/social              → SocialMediaCommandCenter
/admin/reports             → ReportsAnalyticsPage
/admin/safehouses          → SafehousesPage
/admin/partners            → PartnersPage
/admin/users               → UserManagementPage (Admin only)
```

---

## Layout Architecture

### Public Layout
- Clean, minimal navbar: Logo | Mission | Impact | Login/Register
- Full-width hero sections
- Footer with privacy policy link, social media links, copyright

### Admin Layout
- **Collapsible sidebar** (left) — animated width transition with spring physics
  - Logo + org name at top
  - Navigation groups: Overview, Case Management, Donors, Social Media, Reports, Settings
  - Each nav item: icon + label, active state with subtle background + left border accent
  - Collapse to icon-only mode with smooth animation
  - Mobile: slides in as a sheet overlay
- **Top header bar** — breadcrumbs, search (Command palette), notification bell, user avatar dropdown
- **Content area** — max-width container with generous padding, page transition animations

### Page Transition Wrapper
```tsx
import { motion, AnimatePresence } from "motion/react"

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
```

---

## Page Specifications

### 1. Landing Page (`/`)

**Purpose**: Introduce Pharos, its mission, and drive visitors to donate or learn more.

**Sections** (scroll-triggered animations):
1. **Hero** — Full-viewport height. Large heading "A Beacon of Hope for Every Girl". Subtext about the mission. Two CTAs: "Learn More" (scroll) + "Donate Now" (link). Subtle background gradient or soft hero image. Text fades in with stagger.
2. **Impact Stats Strip** — Four animated counting numbers: "60+ Girls Served", "9 Safehouses", "420+ Donations Received", "3 Regions Covered". Numbers count up on scroll-into-view.
3. **Four Pillars** — Cards for Safety, Healing, Justice, Empowerment. Each card has an icon, title, short description. Cards stagger in on scroll.
4. **How It Works** — Three steps: "We Rescue → We Rehabilitate → We Reintegrate". Horizontal timeline on desktop, vertical on mobile. Animated connectors.
5. **Impact Stories** — Pull from `public_impact_snapshots`. Carousel or grid of anonymized stories. Soft card design with quotes.
6. **Call to Action** — "Join Our Mission" section. Buttons: Donate, Volunteer, Follow Us.
7. **Footer** — Privacy Policy link (required), social media icons, copyright, contact.

**Design Notes**: Warm, hopeful, trustworthy. Photography-driven if assets available, otherwise use warm gradient backgrounds. No stock photos of specific children (privacy). Use abstract/silhouette imagery.

---

### 2. Public Impact Dashboard (`/impact`)

**Purpose**: Show aggregated, anonymized organizational impact to potential donors.

**Data Source**: `/api/public/impact-snapshots`, `/api/public/safehouses/summary`

**Sections**:
1. **Monthly Headline** — Latest `public_impact_snapshots` headline + summary
2. **Key Metrics** — Animated counters: Total residents served, Average education progress, Average health improvement, Safehouses active
3. **Trend Charts** — Line charts showing progress over time (from `safehouse_monthly_metrics` aggregated). Education progress, health scores, sessions conducted.
4. **Regional Map** — Visual representation of safehouses across Luzon, Visayas, Mindanao (can be a stylized illustration, not necessarily a real map)
5. **Published Snapshots** — Paginated list of monthly impact reports

**Design Notes**: Data-viz focused. Clean charts with draw-in animations. Make donors feel their money is working.

---

### 3. Login Page (`/login`)

- Clean centered card with Pharos logo
- Email + password fields with validation
- "Sign in with Google" button (third-party auth)
- Link to register
- Error handling: shake animation on invalid credentials
- After login, redirect based on role: Admin → `/admin`, Donor → `/donor/dashboard`

---

### 4. Privacy Policy (`/privacy`)

- Full GDPR-compliant privacy policy
- Clean typographic layout
- Sections: What data we collect, How we use it, Third-party services, Cookies, Your rights, Contact
- Linked from every page footer

---

### 5. Cookie Consent Banner

- Fixed bottom banner that slides up on first visit
- "We use cookies to improve your experience. [Accept All] [Manage Preferences] [Reject]"
- Manage Preferences opens a sheet with toggles: Essential (always on), Analytics, Preferences
- Save preference to a browser-accessible cookie (NOT httpOnly — security requirement for the theme/mode cookie)
- Fully functional: actually controls whether analytics cookies are set
- Animated entrance (slide up with spring)

---

### 6. Admin Dashboard (`/admin`)

**Purpose**: Command center for staff. High-level overview of everything.

**Layout**: Grid of cards/widgets

**Row 1 — Stat Cards** (4 columns):
- Active Residents (count, with animated counter)
- Monthly Donations (₱ total this month, % change from last month)
- Cases Needing Review (count of residents with concerns_flagged in recent process recordings)
- Social Engagement (average engagement_rate this month, trend arrow)

Each card: subtle shadow, hover scale(1.02), icon + number + label + trend indicator. Numbers animate on page load with spring-counting.

**Row 2 — Charts** (2 columns):
- Left: **Donation Trends** — Line/area chart showing monthly donation totals over past 12 months. Filter by donation type. Animated draw-in.
- Right: **Safehouse Occupancy** — Bar chart showing current_occupancy vs capacity_girls for each safehouse. Color-coded by utilization %.

**Row 3 — Activity & Alerts** (2 columns):
- Left: **Recent Activity Feed** — Timeline of recent events: new donations, process recordings, incidents, social media posts. Each item has icon, description, timestamp. Stagger animation.
- Right: **Risk Alerts** (ML-powered) — Cards for:
  - At-risk residents (from ML reintegration model showing regression risk)
  - Lapsing donors (from ML churn model)
  - Each alert: resident/donor name, risk score badge (color-coded), recommended action
  - Click to navigate to detail page

**Row 4 — Quick Actions**:
- Buttons: "New Resident", "Record Session", "Log Donation", "Compose Post"
- Each opens respective form or navigates to create page

---

### 7. Donors & Contributions (`/admin/donors`)

**List View**:
- DataTable with columns: Name, Type (badge), Status (badge), Total Donated (₱), Last Donation Date, Acquisition Channel, Churn Risk (ML badge)
- Filters: supporter_type, status, acquisition_channel, date range
- Search by name/email
- Pagination (server-side, 20 per page)
- Row click → DonorDetailPage
- "Add Supporter" button → opens Sheet/Dialog with form

**Donor Detail Page** (`/admin/donors/:id`):
- Header: Name, type badge, status badge, contact info, acquisition channel
- Tabs:
  - **Donations**: Table of all donations by this supporter. Columns: date, type, amount, campaign, channel. Includes a mini line chart of donation history.
  - **Allocations**: Where their donations went (safehouses + program areas). Pie/donut chart.
  - **Impact**: Personalized impact summary — connect their donation allocations to safehouse outcomes from `safehouse_monthly_metrics`.
  - **ML Insights**: Churn risk score with explanation, recommended retention actions

**Create/Edit Supporter Form**:
- Fields matching `supporters` table
- React Hook Form + Zod validation
- Dropdown for supporter_type, relationship_type, acquisition_channel
- Save → POST/PUT to API

**Create Donation Form**:
- supporter_id (searchable dropdown)
- donation_type, donation_date, is_recurring, campaign_name, channel_source
- Conditional fields: amount + currency_code for Monetary, estimated_value + impact_unit for others
- Allocation sub-form: safehouse + program_area + amount_allocated (can add multiple)

---

### 8. Caseload Inventory (`/admin/residents`)

**Purpose**: Core case management page. This is the most important operational page.

**List View**:
- DataTable with columns: Case Control No, Internal Code, Safehouse (badge), Status (badge), Category, Risk Level (color-coded badge — green/yellow/orange/red), Age, Admission Date, Assigned SW, Reintegration Status
- Filters: case_status, safehouse_id, case_category, risk_level, reintegration_status
- Search by case_control_no, internal_code
- Sortable columns
- Row click → ResidentDetailPage
- "Add Resident" button

**Resident Detail Page** (`/admin/residents/:id`) — Tabbed Layout:

**Header Section** (always visible):
- Case control no, internal code, risk level badge (large, prominent), case status
- Safehouse name, assigned social worker
- Quick stats: Age, length of stay, admission date
- Edit button → opens edit form in Sheet

**Tab: Overview**
- Demographics card: DOB, birth status, place of birth, religion
- Case info card: Category, all sub-categories as badges (trafficking, abuse, etc.)
- Family profile card: 4Ps, solo parent, indigenous, PWD parent, informal settler
- Disability/special needs card (if applicable)
- Referral info: source, agency/person, dates
- Reintegration card: type, status, progress indicator
- ML Readiness Score: visual gauge/ring showing reintegration readiness percentage

**Tab: Process Recordings**
- Chronological list of all sessions (newest first)
- Each entry as a card: date, social worker, session type badge, duration
- Emotional state: visual indicator showing start → end state (e.g., "Anxious → Calm" with arrow)
- Expandable narrative, interventions, follow-up
- Badges for: progress_noted (green), concerns_flagged (red), referral_made (blue)
- "Record New Session" button at top
- Filter by session_type, emotional_state, concerns_flagged

**Tab: Home Visitations**
- List of visits with: date, social worker, visit type badge, outcome badge (color-coded)
- Family cooperation level indicator
- Safety concerns flag (red if noted)
- Expandable observations and follow-up notes
- "Log Visit" button

**Tab: Education**
- Education records as cards or timeline
- Progress chart: line chart of progress_percent over time
- Attendance rate trend
- Current enrollment status, education level, school name
- "Add Record" button

**Tab: Health & Wellbeing**
- Health score trends: multi-line chart showing general_health, nutrition, sleep_quality, energy_level over time
- BMI tracking with visual range indicator
- Checkup status badges: medical, dental, psychological (green if done, gray if not)
- "Add Record" button

**Tab: Intervention Plans**
- Cards grouped by plan_category
- Each card: description, services provided, status badge, target date, progress toward target_value
- Case conference date indicator
- "Create Plan" button

**Tab: Incidents**
- Incident list with severity color-coding (Low=yellow, Medium=orange, High=red)
- Each entry: date, type badge, severity, description, resolution status
- "Report Incident" button

**Case Conference Prep Button** (prominent, top of page):
- Opens a full-page or large dialog with an auto-generated summary:
  - Latest process recording summary
  - Health & education trends (last 3 months)
  - Recent incidents
  - Active intervention plans and their status
  - Home visitation outcomes
  - ML reintegration readiness score
  - All pulled from respective API endpoints and composed into a readable report

---

### 9. Process Recording Page (`/admin/process-recordings`)

- DataTable of all recordings across all residents
- Columns: Date, Resident (link), Social Worker, Type, Duration, Emotional State (start→end), Progress, Concerns
- Filters: resident_id, social_worker, session_type, date range, concerns_flagged
- Click → expand inline or navigate to resident's recordings tab
- Bulk view for social workers to see their caseload's recent sessions

---

### 10. Home Visitations & Case Conferences (`/admin/home-visitations`)

- DataTable of all visitations
- Columns: Date, Resident (link), Social Worker, Visit Type, Cooperation Level, Outcome, Safety Concerns, Follow-up Needed
- Filters: visit_type, family_cooperation_level, visit_outcome, safety_concerns, date range
- Upcoming case conferences section (from intervention_plans.case_conference_date where date is future)

---

### 11. Social Media Command Center (`/admin/social`)

**This is the standout feature page. Make it exceptional.**

**Layout**: Full-width, three-panel or tabbed design.

**Top Bar — Platform Tabs**:
- Horizontal tab bar with platform icons: Facebook, Instagram, LinkedIn, YouTube, TikTok, Twitter, WhatsApp
- "All Platforms" as default view
- Each tab filters all content below to that platform
- Active tab has animated underline indicator

**Panel 1 — Compose & Schedule**:
- Rich compose form:
  - Platform multi-select (which platforms to post to)
  - Media upload area (drag & drop)
  - Caption textarea with character count (varies by platform)
  - Hashtag input with suggestions based on historical data
  - Call to action toggle + type selector
  - Content topic dropdown
  - Schedule date/time picker OR "Post Now" button
  - "AI Recommend" button that shows ML-suggested optimal time and content type
- Recent scheduled posts queue (sortable timeline)

**Panel 2 — Analytics Dashboard**:
- Metric cards: Total Reach (this month), Engagement Rate (avg), Click-throughs, Donation Referrals
- Animated counting numbers on each
- Charts:
  - Engagement over time (line chart, filterable by platform)
  - Best performing content types (bar chart)
  - Platform comparison (radar chart or grouped bars)
  - **Social → Donation Correlation** (scatter plot: engagement_rate vs donation_referrals)
  - Posting heatmap: day of week × hour showing engagement density
- Top performing posts list with metrics

**Panel 3 — Comments Inbox** (Tier 1 platforms):
- Unified feed of recent comments across Facebook, Instagram, LinkedIn, YouTube
- Each comment shows: platform icon, post thumbnail, commenter name, comment text, timestamp
- Inline reply box (sends via respective API)
- Moderate actions: hide, delete (where API supports)
- Filter by platform, read/unread, sentiment

**ML Recommendations Sidebar/Section**:
- "Best time to post next": day + hour with predicted engagement
- "Recommended content type": based on recent performance patterns
- "Predicted engagement": for current draft based on characteristics
- "Campaign insights": which campaigns drive donations vs. just engagement

---

### 12. Reports & Analytics (`/admin/reports`)

**Tabbed sections**:

**Donation Reports**:
- Total donations over time (area chart)
- Breakdown by donation_type (stacked bar)
- Campaign effectiveness comparison (grouped bars: donations by campaign_name)
- Recurring vs one-time trends
- Top donors table
- Allocation distribution across safehouses (sankey or treemap)

**Resident Outcomes**:
- Education progress trends across all residents (aggregated line chart)
- Health score improvements (before/after comparison)
- Emotional state distribution shifts over time
- Reintegration funnel: Not Started → In Progress → Completed
- Safehouse comparison: avg outcomes by safehouse

**Social Media Reports**:
- Cross-platform comparison of engagement metrics
- Content type effectiveness (which post_type drives what outcome)
- Follower growth over time
- Donation attribution: social media posts that led to donations

**OKR Metric** (required for Thursday deliverable):
- One prominent, tracked metric with clear explanation of why it's the most important
- Suggestion: "Resident Progress Score" — composite of education, health, and emotional improvement across all active residents. Display prominently with trend.

---

### 13. Donor Dashboard (`/donor/dashboard`) — Donor Role

**Purpose**: Personalized view for logged-in donors showing their impact.

**Sections**:
1. **Welcome** — "Thank you, [name]. Here's the impact of your generosity."
2. **My Donations Summary** — Total donated (₱), number of donations, active since date. Animated counters.
3. **Where My Money Went** — Donut chart: allocation by safehouse and program area
4. **Impact Metrics** — Connect their allocated safehouses to outcome data from `safehouse_monthly_metrics`:
   - "Your donations to [Safehouse] helped serve [X] residents this month"
   - "Average education progress: [Y]%, Average health score: [Z]/5"
5. **My Donation History** — Simple table of their donations with dates and amounts
6. **Call to Action** — "Give Again" button

---

### 14. Safehouses Page (`/admin/safehouses`)

- Grid of safehouse cards (not a table — more visual)
- Each card: name, region badge, city, capacity visual (progress bar: occupancy/capacity), status badge
- Click → detail view with: full info, partner assignments, residents at this safehouse, monthly metrics chart
- Edit capability for admin

---

## Shared Components to Build

### StatCard
```tsx
// Animated stat card with counting number
interface StatCardProps {
  title: string
  value: number
  format?: "currency" | "number" | "percent"
  trend?: { value: number; direction: "up" | "down" }
  icon?: LucideIcon
}
```
- Number animates from 0 to value using spring physics on mount
- Trend arrow with green (up=good) or red (down=bad) coloring
- Subtle hover scale

### RiskBadge
```tsx
// Color-coded risk level badge
interface RiskBadgeProps {
  level: "Low" | "Medium" | "High" | "Critical"
}
```
- Low: green, Medium: yellow, High: orange, Critical: red
- Subtle pulse animation on Critical

### EmotionalStateIndicator
```tsx
// Shows emotional state transition
interface EmotionalStateIndicatorProps {
  start: string  // e.g., "Anxious"
  end: string    // e.g., "Calm"
}
```
- Arrow from start to end with color coding (negative states in warm colors, positive in cool)

### DataTableWrapper
- Wraps TanStack Table with shadcn styling
- Built-in: pagination, sorting, column visibility toggle, search, filter dropdowns
- Row enter animation (staggered)
- Skeleton loader while fetching

### PageHeader
```tsx
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode  // Buttons like "Add New"
  breadcrumbs?: { label: string; href: string }[]
}
```

### DeleteConfirmDialog
- Uses shadcn AlertDialog
- "Are you sure?" with item name
- Type-to-confirm for critical deletes (type the item name)
- Required by security specs

### SkeletonPage
- Full-page skeleton loader matching the layout of the page being loaded
- Shimmer animation

---

## Animation Patterns (Copy-Paste Reference)

### Staggered List
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.div key={i.id} variants={item}>{/* content */}</motion.div>
  ))}
</motion.div>
```

### Counting Number
```tsx
import { useSpring, animated } from "motion/react" // or use a dedicated CountingNumber component

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  // Animate spring to value on mount
  // Display with toLocaleString() for formatting
}
```

### Hover Card Scale
```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  <Card>...</Card>
</motion.div>
```

### Chart Draw-In
- Recharts supports `isAnimationActive` prop on all chart components
- Set `animationBegin={200}` `animationDuration={800}` `animationEasing="ease-out"`

---

## Auth Context

```tsx
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
  isStaff: boolean
  isDonor: boolean
}
```

- On app mount, call `/api/auth/me` to check session
- Protected routes redirect to `/login` if unauthenticated
- Role-based route guards: AdminRoute, StaffRoute, DonorRoute wrappers

---

## API Client

```tsx
// lib/api.ts
const api = {
  baseURL: import.meta.env.VITE_API_URL || "/api",
  
  async get<T>(path: string, params?: Record<string, any>): Promise<T> { ... },
  async post<T>(path: string, body: any): Promise<T> { ... },
  async put<T>(path: string, body: any): Promise<T> { ... },
  async delete(path: string): Promise<void> { ... },
}
```

- Uses fetch with credentials: "include" (for cookie auth)
- Automatic error handling: 401 → redirect to login, 403 → show forbidden, 500 → toast error
- All responses typed with generics

---

## Responsive Design

- **Desktop**: Full sidebar + content layout, multi-column grids
- **Tablet (768px)**: Collapsed sidebar (icon-only), 2-column grids
- **Mobile (640px)**: No sidebar (hamburger menu → sheet overlay), single column, cards stack vertically
- All DataTables: horizontal scroll on mobile with fixed first column
- Charts: responsive containers that resize
- Test every page at both breakpoints

---

## Dark Mode

- Implement via CSS class strategy (`dark` class on `<html>`)
- Toggle in header bar (sun/moon icon button)
- Save preference to a **browser-accessible cookie** (not httpOnly) — this is a security requirement
- React reads the cookie on mount to set initial theme
- All shadcn components support dark mode natively via CSS variables
- Charts need dark-mode color adjustments (lighter lines on dark backgrounds)

---

## Performance

- React Query for all data fetching (caching, deduplication, background refetch)
- Lazy load route components with `React.lazy` + `Suspense`
- Skeleton loaders during suspense
- Virtual scrolling for very long lists (TanStack Virtual if needed)
- Image optimization: lazy loading, WebP format
- Bundle splitting per route
