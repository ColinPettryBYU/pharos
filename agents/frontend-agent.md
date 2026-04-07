# Frontend Agent — Pharos

> Reference `CLAUDE.md` for project context, database schema, API structure, and design system.
> Reference `agents/design-system-agent.md` for the visual overhaul (colors, typography, components). Apply the design system FIRST.
> Reference `agents/backend-agent.md` for the complete list of existing API endpoints and their response shapes.

You are responsible for restructuring the React + TypeScript frontend. The core work: **replace all mock data with real API calls**, **merge Dashboard and Reports into one page**, **build real CRUD forms for every dead-end button**, and **redesign page layouts for storytelling rather than data overload**.

---

## Current State — What Exists

### Infrastructure (keep as-is)
- **Router**: `react-router-dom` in `App.tsx` with lazy-loaded pages
- **Auth**: `lib/auth.tsx` — cookie-based auth context with `login`, `logout`, `registerUser`, `loginWithGoogle`
- **API client**: `lib/api.ts` — `api.get/post/put/delete` with cookie credentials, error handling, toast on 403/500
- **Theme**: `lib/theme.tsx` — dark/light toggle with `pharos_theme` cookie
- **Types**: `types/index.ts` — all TypeScript interfaces for entities, DTOs, enums
- **Query client**: `@tanstack/react-query` configured in `App.tsx` with 5-minute stale time
- **UI components**: 25 shadcn components in `components/ui/`
- **Shared components**: `StatCard`, `DataTableWrapper`, `PageHeader`, `RiskBadge`, `EmotionalStateIndicator`, `DeleteConfirmDialog`, `SkeletonPage`, `CookieConsentBanner`
- **Layouts**: `AdminLayout`, `PublicLayout`, `PageTransition`, `RouteGuards`

### Pages (19 total — all use mock data)
| Page | File | Mock imports | Dead buttons |
|---|---|---|---|
| AdminDashboard | `pages/admin/AdminDashboard.tsx` | `mockDashboardStats`, `mockActivityFeed`, `mockRiskAlerts`, `mockDonationTrends`, `mockSafehouses` | None (quick actions are Links) |
| DonorsPage | `pages/admin/DonorsPage.tsx` | `mockSupporters` | "Add Supporter" sheet (toast-only) |
| DonorDetailPage | `pages/admin/DonorDetailPage.tsx` | `mockSupporters`, `mockDonations`, `mockAllocations` | None |
| DonationsPage | `pages/admin/DonationsPage.tsx` | `mockDonations` | "Log Donation" (no handler) |
| ResidentsPage | `pages/admin/ResidentsPage.tsx` | `mockResidents` | "Add Resident" (no handler) |
| ResidentDetailPage | `pages/admin/ResidentDetailPage.tsx` | All resident sub-mocks | None (but tabs are read-only) |
| ProcessRecordingsPage | `pages/admin/ProcessRecordingsPage.tsx` | `mockProcessRecordings` | "Record Session" (no handler) |
| HomeVisitationsPage | `pages/admin/HomeVisitationsPage.tsx` | `mockHomeVisitations`, `mockInterventionPlans` | "Log Visit" (no handler) |
| SocialMediaPage | `pages/admin/SocialMediaPage.tsx` | `mockSocialMediaPosts`, `mockSocialComments` | Compose/Schedule/Reply (toast-only) |
| ReportsPage | `pages/admin/ReportsPage.tsx` | `mockDonationTrends` + inline hardcoded data | None |
| SafehousesPage | `pages/admin/SafehousesPage.tsx` | `mockSafehouses` | None |
| PartnersPage | `pages/admin/PartnersPage.tsx` | `mockPartners` | "Add Partner" (no handler) |
| UserManagementPage | `pages/admin/UserManagementPage.tsx` | Inline `mockUsers` | "Invite User" (no handler), role Select (toast-only) |
| DonorDashboard | `pages/donor/DonorDashboard.tsx` | `mockDonations`, `mockAllocations`, `mockSafehouses` | "Give Again" (no handler) |
| LandingPage | `pages/public/LandingPage.tsx` | Inline `impactStats`, `pillars`, `steps` | None |
| ImpactDashboard | `pages/public/ImpactDashboard.tsx` | `mockImpactSnapshots` + inline `trendData` | None |
| LoginPage | `pages/public/LoginPage.tsx` | None (uses real auth) | None |
| RegisterPage | `pages/public/RegisterPage.tsx` | None (uses real auth) | None |
| PrivacyPolicy | `pages/public/PrivacyPolicy.tsx` | None (static) | None |

---

## Step 1: Create React Query Hooks

Create a `hooks/` directory with one file per domain. Each hook uses `@tanstack/react-query` with the existing `api` client from `lib/api.ts`.

### `hooks/useSupporters.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Supporter } from "@/types";

interface SupporterFilters {
  page?: number;
  pageSize?: number;
  supporterType?: string;
  status?: string;
  search?: string;
}

export function useSupporters(filters: SupporterFilters = {}) {
  return useQuery({
    queryKey: ["supporters", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Supporter>>("/admin/supporters", filters),
  });
}

export function useSupporter(id: number) {
  return useQuery({
    queryKey: ["supporters", id],
    queryFn: () => api.get<Supporter>(`/admin/supporters/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/supporters", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supporters"] }),
  });
}

export function useUpdateSupporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/supporters/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supporters"] }),
  });
}

export function useDeleteSupporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/supporters/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supporters"] }),
  });
}
```

### Create the same pattern for every domain:

| Hook file | Query keys | API endpoints |
|---|---|---|
| `hooks/useSupporters.ts` | `["supporters"]` | `/admin/supporters` |
| `hooks/useDonations.ts` | `["donations"]` | `/admin/donations` |
| `hooks/useResidents.ts` | `["residents"]` | `/admin/residents` |
| `hooks/useProcessRecordings.ts` | `["processRecordings"]` | `/admin/process-recordings` |
| `hooks/useHomeVisitations.ts` | `["homeVisitations"]` | `/admin/home-visitations` |
| `hooks/useEducationRecords.ts` | `["educationRecords"]` | `/admin/education-records` |
| `hooks/useHealthRecords.ts` | `["healthRecords"]` | `/admin/health-records` |
| `hooks/useInterventionPlans.ts` | `["interventionPlans"]` | `/admin/intervention-plans` |
| `hooks/useIncidentReports.ts` | `["incidentReports"]` | `/admin/incident-reports` |
| `hooks/useSafehouses.ts` | `["safehouses"]` | `/admin/safehouses` |
| `hooks/usePartners.ts` | `["partners"]` | `/admin/partners` |
| `hooks/useSocialMedia.ts` | `["socialPosts"]`, `["socialAnalytics"]` | `/admin/social-media/posts`, `/admin/social-media/analytics` |
| `hooks/useReports.ts` | `["reports", "donations"]`, etc. | `/admin/reports/donations`, `/admin/reports/outcomes`, `/admin/reports/safehouses`, `/admin/reports/social-media` |
| `hooks/useDashboard.ts` | `["dashboard"]` | `/admin/dashboard` (new endpoint) |
| `hooks/useML.ts` | `["ml", "churn"]`, etc. | `/ml/donor-churn-risk`, `/ml/reintegration-readiness/{id}`, `/ml/social-media-recommendations`, `/ml/intervention-effectiveness` |
| `hooks/useUsers.ts` | `["users"]` | `/admin/users` |
| `hooks/usePublicData.ts` | `["public", "impact"]`, `["public", "safehouses"]` | `/public/impact-snapshots`, `/public/safehouses/summary` |
| `hooks/useDonorPortal.ts` | `["donor", "profile"]`, etc. | `/donor/my-profile`, `/donor/my-donations`, `/donor/my-impact` |

Each hook follows the same pattern: `useQuery` for reads, `useMutation` for writes with `queryClient.invalidateQueries` on success.

---

## Step 2: Delete Mock Data

Delete `frontend/src/lib/mock-data.ts` entirely. This will cause build errors in every page that imports from it — that's intentional. Each page gets rewritten to use the hooks above.

---

## Step 3: Merge Dashboard + Reports

### Route Changes

In `App.tsx`:
- **Remove** the `ReportsPage` lazy import and its route (`/admin/reports`)
- The `/admin` route stays as `AdminDashboard`

In `AdminLayout.tsx` sidebar nav:
- Remove the "Analytics" nav item under the "Reports" group
- Rename "Overview > Dashboard" to "Overview > Home" (or keep as "Dashboard")

### Delete `pages/admin/ReportsPage.tsx`

### Rewrite `pages/admin/AdminDashboard.tsx`

The new unified dashboard pulls from real APIs and has tabbed analytics sections.

**Structure:**

```
1. PageHeader — "Dashboard" with date range selector
2. KPI Row — 4 StatCards (real data from /api/admin/dashboard or /api/admin/reports/*)
3. Tabbed Analytics Section:
   - "Donations" tab — monthly trends chart, campaign comparison, channel breakdown
   - "Outcomes" tab — risk distribution, reintegration funnel, health/education progress
   - "Social" tab — engagement over time, platform comparison, donation correlation
   - "Safehouses" tab — occupancy comparison, outcome metrics by safehouse
4. OKR Metric — Prominently displayed resident progress composite score
5. Two-column bottom:
   - Left: Activity feed (recent events)
   - Right: Risk alerts (ML-powered)
```

**Data sources:**
- KPI stats: `useDashboard()` hook → `GET /api/admin/dashboard`
- Donation analytics: `useReports("donations")` → `GET /api/admin/reports/donations`
- Outcomes: `useReports("outcomes")` → `GET /api/admin/reports/outcomes`
- Social: `useReports("social-media")` → `GET /api/admin/reports/social-media`
- Safehouses: `useReports("safehouses")` → `GET /api/admin/reports/safehouses`
- Activity + alerts: included in dashboard response

**Layout philosophy:** Each tab tells a story. The Donations tab doesn't just dump 5 charts — it leads with the headline number ("₱234,500 raised this month"), shows the trend, then breaks it down by campaign and channel. Use progressive disclosure: summary visible, details expand on demand.

---

## Step 4: Wire Every Admin Page to Real API

### DonorsPage (`/admin/donors`)

**Replace:**
```typescript
// DELETE: import { mockSupporters } from "@/lib/mock-data";
// ADD:
import { useSupporters, useCreateSupporter } from "@/hooks/useSupporters";

// In component:
const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
const { data, isLoading } = useSupporters(filters);
const supporters = data?.data ?? [];
```

**Fix "Add Supporter" sheet:** The existing sheet has uncontrolled `<Input>` elements and a toast-only submit. Replace with React Hook Form + Zod:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const supporterSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  supporterType: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  country: z.string().min(1),
  acquisitionChannel: z.string().optional(),
  // ... all fields from CreateSupporterRequest DTO
});

// In the sheet submit handler:
const createSupporter = useCreateSupporter();
const onSubmit = async (data: z.infer<typeof supporterSchema>) => {
  await createSupporter.mutateAsync(data);
  toast.success("Supporter added successfully");
  setSheetOpen(false);
};
```

### DonationsPage (`/admin/donations`)

**Replace** `mockDonations` with `useDonations(filters)`.

**Build "Log Donation" form** in a Sheet:
- Fields: supporter (searchable select from `useSupporters`), donation_type (select), amount, campaign_name, channel_source, is_recurring (switch), donation_date (calendar)
- Conditional: show `estimated_value` + `impact_unit` for non-Monetary types
- Sub-form for allocations: safehouse select + program_area + amount_allocated (repeatable)
- Submit: `POST /api/admin/donations`
- Validation: Zod schema matching `CreateDonationRequest` DTO

### ResidentsPage (`/admin/residents`)

**Replace** `mockResidents` with `useResidents(filters)`.

**Build "Add Resident" form** in a Sheet (this is the longest form):
- Section 1: Case info — case_control_no, internal_code, safehouse_id (select), case_status, case_category
- Section 2: Demographics — sex, date_of_birth, birth_status, place_of_birth, religion
- Section 3: Sub-categories — checkboxes for all `sub_cat_*` boolean flags
- Section 4: Special needs — is_pwd, pwd_type, has_special_needs, special_needs_diagnosis
- Section 5: Family profile — family_is_4ps, family_solo_parent, etc. (checkboxes)
- Section 6: Referral — referral_source, referring_agency_person, date_of_admission
- Section 7: Reintegration — type, status, initial_risk_level
- Submit: `POST /api/admin/residents`

Use a scrollable sheet with section headers so it's not overwhelming.

### ResidentDetailPage (`/admin/residents/:id`)

**Replace** all mock imports with hooks:
```typescript
const { id } = useParams();
const { data: resident } = useResident(Number(id));
const { data: recordings } = useResidentRecordings(Number(id));
const { data: visitations } = useResidentVisitations(Number(id));
// Education, health, interventions, incidents loaded per tab (on tab switch)
```

Use the existing endpoint `GET /api/admin/residents/{id}` for the resident detail, and `GET /api/admin/residents/{id}/process-recordings` and `GET /api/admin/residents/{id}/home-visitations` for sub-resources. For education, health, interventions, and incidents, filter the general list endpoints by `residentId` query param.

**Add edit forms** within tabs:
- "Add Record" buttons in Education and Health tabs → Sheet with form → POST to respective endpoint
- "Create Plan" in Interventions tab → Sheet → POST `/api/admin/intervention-plans`
- "Report Incident" in Incidents tab → Sheet → POST `/api/admin/incident-reports`
- "Record New Session" in Recordings tab → Sheet → POST `/api/admin/process-recordings`
- "Log Visit" in Visitations tab → Sheet → POST `/api/admin/home-visitations`

### ProcessRecordingsPage (`/admin/process-recordings`)

**Replace** `mockProcessRecordings` with `useProcessRecordings(filters)`.

**Build "Record Session" form** in a Sheet:
- Fields: resident_id (searchable select), session_type (Individual/Group), session_duration_minutes, emotional_state_observed (select), emotional_state_end (select), session_narrative (textarea), interventions_applied (textarea), follow_up_actions (textarea), progress_noted (switch), concerns_flagged (switch), referral_made (switch)
- Submit: `POST /api/admin/process-recordings`

### HomeVisitationsPage (`/admin/home-visitations`)

**Replace** `mockHomeVisitations` with `useHomeVisitations(filters)`.

**Build "Log Visit" form** in a Sheet:
- Fields: resident_id, visit_type (select), visit_date (calendar), location_visited, family_members_present, purpose (textarea), observations (textarea), family_cooperation_level (select), safety_concerns_noted (switch), follow_up_needed (switch), follow_up_notes (textarea), visit_outcome (select)
- Submit: `POST /api/admin/home-visitations`

### SafehousesPage (`/admin/safehouses`)

**Replace** `mockSafehouses` with `useSafehouses()`.

### PartnersPage (`/admin/partners`)

**Replace** `mockPartners` with `usePartners(filters)`.

**Build "Add Partner" form** in a Sheet:
- Fields: partner_name, partner_type, role_type, contact_name, email, phone, region, status, start_date
- Submit: `POST /api/admin/partners`

### UserManagementPage (`/admin/users`)

**Delete** the inline `mockUsers` array. Replace with `useUsers()`.

**Build "Invite User" dialog:**
- Fields: email, displayName, password, role (select: Admin/Staff/Donor), linkedSupporterId (optional, shown when role=Donor)
- Submit: `POST /api/admin/users/invite`

**Wire role Select:**
```typescript
// Replace toast-only onChange with:
const updateRole = useMutation({
  mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
    api.put(`/admin/users/${userId}/roles`, { roles }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    toast.success("Role updated");
  },
});
```

### SocialMediaPage (`/admin/social`)

**Replace** `mockSocialMediaPosts` with `useSocialPosts(filters)` and `mockSocialComments` with the comments inbox endpoint.

**Wire compose form** to `POST /api/admin/social-media/compose`:
- The existing UI has platform badges, caption, topic, CTA, hashtags, schedule datetime
- Connect each field to React Hook Form state
- Submit calls the compose endpoint
- See `agents/social-media-agent.md` for full integration details

**Wire reply** to `POST /api/admin/social-media/comments/{id}/reply`

**Fix hardcoded "AI Recommendations" and "ML Insights" cards:**
- Replace with data from `GET /api/ml/social-media-recommendations`

---

## Step 5: Wire Public Pages

### LandingPage (`/`)

Replace inline `impactStats` with real data:
```typescript
const { data: summary } = useQuery({
  queryKey: ["public", "safehouses"],
  queryFn: () => api.get("/public/safehouses/summary"),
});
```

The `pillars` and `steps` arrays are static content (not database data) — those can stay as inline constants.

### ImpactDashboard (`/impact`)

Replace `mockImpactSnapshots` and inline `trendData`:
```typescript
const { data: snapshots } = useQuery({
  queryKey: ["public", "impact"],
  queryFn: () => api.get("/public/impact-snapshots"),
});
```

The stat cards showing "60", "78%", "4.2", "9" should be computed from the snapshots data or the safehouse summary endpoint.

---

## Step 6: Wire Donor Pages

### DonorDashboard (`/donor/dashboard`)

Replace all mock imports:
```typescript
const { data: profile } = useQuery({
  queryKey: ["donor", "profile"],
  queryFn: () => api.get("/donor/my-profile"),
});
const { data: donations } = useQuery({
  queryKey: ["donor", "donations"],
  queryFn: () => api.get("/donor/my-donations"),
});
const { data: impact } = useQuery({
  queryKey: ["donor", "impact"],
  queryFn: () => api.get("/donor/my-impact"),
});
```

**"Give Again" button:** Link to the organization's external donation page, or navigate to a donation form if one exists. For now, a reasonable approach is `<Button asChild><a href="https://www.lighthousesanctuary.org/donate" target="_blank">Give Again</a></Button>`.

---

## Step 7: Page Layout Philosophy

Every page redesign should follow these principles:

### Lead With the Headline
Each page should start with the single most important number or insight. Not 4 stat cards — 1 hero metric. Example: Donors page leads with "60 Active Supporters" as a large Manrope number, with "₱1.2M total contributed" as the subtext.

### Progressive Disclosure
Show summary first, details on demand. Tables are secondary to the narrative. Consider: a summary sentence at the top of each table section explaining what the data shows.

### Breathing Room
- Minimum 2rem (32px) gap between major sections
- Cards have generous internal padding (p-6)
- No more than 3-4 stat cards in a row (on desktop)
- Tables don't need to fill 100% width — max-width containers are fine

### Storytelling Structure

For each admin page:

```
1. Hero metric / headline stat
2. Brief context sentence (e.g., "3 donors at risk of lapsing this month")
3. Primary action button (e.g., "Add Supporter")
4. Data table or card grid (the main content)
5. Secondary insights or related data below
```

### Typography Integration
- Page titles: `font-heading text-3xl font-bold tracking-tight`
- Section headings: `font-heading text-xl font-semibold`
- Stat numbers: `font-sans text-4xl font-bold tabular-nums tracking-tight`
- Body/labels: `text-sm text-muted-foreground`

---

## Step 8: Loading & Error States

Every page that fetches data must handle:

**Loading:** Use the `isLoading` prop on `DataTableWrapper` (already supports skeleton). For non-table pages, use `SkeletonPage` or inline `Skeleton` components.

**Error:** If the query fails, show a centered error message with a retry button:
```tsx
if (error) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-muted-foreground mb-4">Failed to load data</p>
      <Button variant="outline" onClick={() => refetch()}>
        Try Again
      </Button>
    </div>
  );
}
```

**Empty state:** When the data array is empty (not loading, no error), show a friendly empty state with an action:
```tsx
if (data?.length === 0) {
  return (
    <div className="text-center py-20">
      <p className="text-lg font-medium mb-2">No supporters yet</p>
      <p className="text-muted-foreground mb-4">Add your first supporter to get started</p>
      <Button onClick={() => setSheetOpen(true)}>Add Supporter</Button>
    </div>
  );
}
```

---

## Step 9: Form Patterns

All CRUD forms use the same stack:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
```

**Zod schemas** should match the backend DTOs. The TypeScript interfaces in `types/index.ts` align with the CSV columns; the create/update DTOs on the backend use PascalCase. The API client sends JSON with the casing you provide — make sure the field names match what the backend expects (PascalCase for .NET: `SupporterType`, `DisplayName`, etc.).

**Form container:** Use `Sheet` for side panels (add/edit forms) and `Dialog` for small confirmations (delete). Sheets should have `side="right"` and enough width for forms (`className="sm:max-w-lg"` override on SheetContent).

**Submit pattern:**
```typescript
const mutation = useCreateThing();

const onSubmit = form.handleSubmit(async (values) => {
  try {
    await mutation.mutateAsync(values);
    toast.success("Created successfully");
    form.reset();
    setOpen(false);
  } catch (err) {
    // ApiError is thrown by api client, toast is shown by handleResponse
  }
});
```

**Edit pattern:** Pre-populate the form when editing:
```typescript
useEffect(() => {
  if (editItem) {
    form.reset({
      displayName: editItem.display_name,
      supporterType: editItem.supporter_type,
      // ... map snake_case DB fields to PascalCase form fields
    });
  }
}, [editItem]);
```

---

## Step 10: Delete Confirmation

Every delete action must use `DeleteConfirmDialog` (already exists in `components/shared/`). Wire it to the real delete mutation:

```tsx
<DeleteConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  title="Delete Supporter"
  description={`This will permanently delete ${selectedItem?.display_name}.`}
  onConfirm={async () => {
    await deleteSupporter.mutateAsync(selectedItem.supporter_id);
    toast.success("Supporter deleted");
    setDeleteOpen(false);
  }}
/>
```

---

## Summary Checklist

- [ ] Create all React Query hooks in `hooks/` directory (18+ hook files)
- [ ] Delete `lib/mock-data.ts`
- [ ] Remove `/admin/reports` route from `App.tsx`
- [ ] Delete `pages/admin/ReportsPage.tsx`
- [ ] Remove "Analytics" from sidebar nav in `AdminLayout.tsx`
- [ ] Rewrite `AdminDashboard.tsx` — unified dashboard with tabbed analytics
- [ ] Wire `DonorsPage` + fix Add Supporter sheet form
- [ ] Wire `DonationsPage` + build Log Donation sheet form
- [ ] Wire `ResidentsPage` + build Add Resident sheet form
- [ ] Wire `ResidentDetailPage` tabs + add create forms per tab
- [ ] Wire `ProcessRecordingsPage` + build Record Session sheet form
- [ ] Wire `HomeVisitationsPage` + build Log Visit sheet form
- [ ] Wire `SafehousesPage`
- [ ] Wire `PartnersPage` + build Add Partner sheet form
- [ ] Wire `UserManagementPage` + build Invite User dialog + wire role select
- [ ] Wire `SocialMediaPage` compose/reply to real endpoints
- [ ] Wire `LandingPage` impact stats to public API
- [ ] Wire `ImpactDashboard` to public API
- [ ] Wire `DonorDashboard` to donor API
- [ ] Add loading states to every page
- [ ] Add error states with retry to every page
- [ ] Add empty states to list pages
- [ ] Add delete confirmation to all delete actions
- [ ] Apply page layout philosophy (hero metric, breathing room, storytelling)
- [ ] Verify all forms submit PascalCase field names matching backend DTOs
- [ ] Test every page with real data from the seeded database
