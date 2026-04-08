# CRUD Compliance Agent — Pharos

> Reference `CLAUDE.md` for project context, database schema, and API structure.
> Reference `INTEX W26 Case.md` for the authoritative requirements.

You are responsible for ensuring all required Create, Read, Update, and Delete operations are fully implemented end-to-end (backend API + frontend UI) per the INTEX W26 Case requirements.

---

## Case Document Requirements (Source of Truth)

From `INTEX W26 Case.md`:

1. **Donors & Contributions (line 103):** "view, create, and manage supporter profiles" + "record and review donation activity" — **manage** implies Update + Delete.
2. **Caseload Inventory (line 104):** "view, create, and update resident profiles" — **Update explicitly required**. Delete implied by admin RBAC.
3. **Process Recording (line 105):** "entering and viewing dated counseling session notes" — **Create + Read**. Update is useful for corrections.
4. **Home Visitation (line 106):** "log home and field visits" + "view case conference history" — **Create + Read**. Update is useful.
5. **RBAC (line 138):** "Only an authenticated user with an admin role should be able to add, modify, or in rare cases delete data."
6. **Integrity (line 140):** "there must be confirmation required to delete data" — **Every delete must use `DeleteConfirmDialog`**.
7. **Security Rubric (line 170-171):** "RBAC - Only admin user can CUD" (1.5 pts) + "Confirmation to delete data" (1 pt).

---

## Current State Audit

### Backend API (Controllers + Services)

| Entity | Create | Read | Update | Delete | Notes |
|---|:---:|:---:|:---:|:---:|---|
| Supporters | POST | GET, GET/:id | PUT/:id | DELETE/:id | Full CRUD |
| Donations | POST | GET, GET/:id | PUT/:id | DELETE/:id | Full CRUD |
| Residents | POST | GET, GET/:id | PUT/:id | DELETE/:id | Full CRUD |
| Process Recordings | POST | GET, GET/:id | PUT/:id | **None** | No DELETE endpoint |
| Home Visitations | POST | GET | PUT/:id | **None** | No DELETE endpoint |
| Partners | POST | GET | PUT/:id | DELETE/:id | Full CRUD |
| Incident Reports | POST | GET | PUT/:id | DELETE/:id | Full CRUD |
| Education Records | POST | GET | PUT/:id | **None** | No DELETE endpoint |
| Health Records | POST | GET | PUT/:id | **None** | No DELETE endpoint |
| Intervention Plans | POST | GET | PUT/:id | **None** | No DELETE endpoint |
| Safehouses | POST | GET, GET/:id | PUT/:id | DELETE/:id | Full CRUD (**working**) |

### Frontend Pages — What's Wired

| Page | Create | Read | Update | Delete | Notes |
|---|:---:|:---:|:---:|:---:|---|
| `DonorsPage.tsx` | Sheet form | Table + Detail | **NOT WIRED** | Dialog exists, **no trigger** | Hook `useUpdateSupporter` exists but unused. `setDeleteOpen(true)` never called. |
| `DonationsPage.tsx` | Sheet form | Table | **NOT WIRED** | **NOT WIRED** | Hooks `useUpdateDonation`, `useDeleteDonation` exist but unused. |
| `ResidentsPage.tsx` | Sheet form | Table + Detail | **NOT WIRED** | **NOT WIRED** | Hooks exist. Case **explicitly requires** Update. |
| `ProcessRecordingsPage.tsx` | Sheet form | Table | **NOT WIRED** | N/A (no backend) | Hook `useUpdateProcessRecording` exists. |
| `HomeVisitationsPage.tsx` | Sheet form | Table | **NOT WIRED** | N/A (no backend) | Hook `useUpdateHomeVisitation` exists. |
| `PartnersPage.tsx` | Sheet form | Table | **NOT WIRED** | Dialog exists, **no trigger** | Same dead-code pattern as DonorsPage. |
| `SafehousesPage.tsx` | **None** | Card grid | **None** | **WORKING** | Delete works. Needs Create + Update. |
| `UserManagementPage.tsx` | Invite | List | Role change | **WORKING** | Fully functional. |

### Frontend Hooks (existing but unused)

These hooks exist in the codebase and are ready to be wired:

| Hook | File |
|---|---|
| `useUpdateSupporter()` | `frontend/src/hooks/useSupporters.ts` |
| `useDeleteSupporter()` | `frontend/src/hooks/useSupporters.ts` |
| `useUpdateDonation()` | `frontend/src/hooks/useDonations.ts` |
| `useDeleteDonation()` | `frontend/src/hooks/useDonations.ts` |
| `useUpdateResident()` | `frontend/src/hooks/useResidents.ts` |
| `useDeleteResident()` | `frontend/src/hooks/useResidents.ts` |
| `useUpdateProcessRecording()` | `frontend/src/hooks/useProcessRecordings.ts` |
| `useUpdateHomeVisitation()` | `frontend/src/hooks/useHomeVisitations.ts` |
| `useUpdatePartner()` | `frontend/src/hooks/usePartners.ts` |
| `useDeletePartner()` | `frontend/src/hooks/usePartners.ts` |
| `useUpdateIncidentReport()` | `frontend/src/hooks/useIncidentReports.ts` |

---

## Implementation Plan

### Pattern: Row-Level Actions

Every data table that needs Update/Delete should get an "Actions" column as the last column. Use a `DropdownMenu` with Edit and Delete options:

```typescript
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Add as the last column definition:
{
  id: "actions",
  cell: ({ row }) => {
    const item = row.original;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setEditTarget(item); setSheetOpen(true); }}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => { setDeleteTarget(item); setDeleteOpen(true); }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
}
```

### Pattern: Edit via Sheet (reuse create form)

The create sheet form should become a shared create/edit sheet. Add `editTarget` state:

```typescript
const [editTarget, setEditTarget] = useState<EntityType | null>(null);
const updateMutation = useUpdateEntity();

// When opening the sheet for edit, populate form:
useEffect(() => {
  if (editTarget) {
    form.reset({
      FieldOne: editTarget.field_one,
      FieldTwo: editTarget.field_two,
      // ... map all snake_case API fields to PascalCase form fields
    });
  }
}, [editTarget]);

// On submit, check if editing or creating:
const onSubmit = async (data: FormType) => {
  try {
    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget.id, data });
      toast.success("Updated successfully");
    } else {
      await createMutation.mutateAsync(data);
      toast.success("Created successfully");
    }
    setSheetOpen(false);
    setEditTarget(null);
    form.reset();
    refetch();
  } catch {
    toast.error("Operation failed");
  }
};

// When closing sheet, clear edit target:
<Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setEditTarget(null); }}>
  <SheetHeader>
    <SheetTitle>{editTarget ? "Edit" : "Create"} {EntityName}</SheetTitle>
  </SheetHeader>
  {/* ... form fields ... */}
</Sheet>
```

### Pattern: Delete with Confirmation

The `DeleteConfirmDialog` component at `frontend/src/components/shared/DeleteConfirmDialog.tsx` requires typing the item name to confirm. It's already used in SafehousesPage and UserManagementPage.

```typescript
<DeleteConfirmDialog
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  itemName={deleteTarget?.display_name || ""}
  loading={deleteMutation.isPending}
  onConfirm={async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Deleted successfully");
      setDeleteOpen(false);
      setDeleteTarget(null);
      refetch();
    }
  }}
/>
```

---

## Per-Page Changes

### 1. `DonorsPage.tsx` (Supporters)

**Current:** Create sheet + read table. Delete dialog exists but no trigger. No update.

**Changes:**
- Add `useUpdateSupporter` import (already has `useDeleteSupporter`)
- Add `editTarget` state
- Add "Actions" column to table with Edit + Delete menu items
- On Edit click: set `editTarget`, populate form, open sheet
- On Delete click: set `deleteTarget` and `setDeleteOpen(true)` — **this is the missing trigger**
- Modify sheet title: "Edit Supporter" vs "Add Supporter" based on `editTarget`
- On submit: branch between create and update

### 2. `DonationsPage.tsx`

**Current:** Create sheet + read table. No update or delete UI.

**Changes:**
- Add `useUpdateDonation`, `useDeleteDonation` imports
- Add `editTarget`, `deleteOpen`, `deleteTarget` state
- Add "Actions" column with Edit + Delete
- Add `DeleteConfirmDialog` component (import from `@/components/shared/DeleteConfirmDialog`)
- Edit populates the create sheet with existing values
- Delete uses confirmation dialog with donation info (e.g., "₱1,234 from John Doe")

### 3. `ResidentsPage.tsx`

**Current:** Create sheet + read table. No update or delete UI.

**Changes:**
- Add `useUpdateResident`, `useDeleteResident` imports
- Add `editTarget`, `deleteOpen`, `deleteTarget` state
- Add "Actions" column with Edit + Delete
- Add `DeleteConfirmDialog`
- Edit populates the create sheet with existing resident data
- This is **the most important Update** — the case doc explicitly says "view, create, and update resident profiles"

### 4. `ProcessRecordingsPage.tsx`

**Current:** Create sheet + read table. No update UI. No delete needed per case doc.

**Changes:**
- Add `useUpdateProcessRecording` import
- Add `editTarget` state
- Add "Actions" column with Edit only (no Delete — case doc says "enter and view")
- Edit populates the create sheet with existing recording data

### 5. `HomeVisitationsPage.tsx`

**Current:** Create sheet + read table. No update UI. No delete needed per case doc.

**Changes:**
- Add `useUpdateHomeVisitation` import
- Add `editTarget` state
- Add "Actions" column with Edit only (no Delete)
- Edit populates the create sheet with existing visit data

### 6. `PartnersPage.tsx`

**Current:** Create sheet + read table. Delete dialog exists but no trigger. No update.

**Changes:**
- Add `useUpdatePartner` import
- Add `editTarget` state
- Add "Actions" column with Edit + Delete menu items
- On Delete click: `setDeleteTarget(partner); setDeleteOpen(true);` — **this is the missing trigger**
- On Edit click: populate form, open sheet

### 7. `SafehousesPage.tsx`

**Current:** Card grid with delete. No create or update.

**Changes:**
- This page uses a card layout, not a table. Add an edit icon button on each card.
- Add a "Add Safehouse" button in the PageHeader area
- Add a Sheet form for creating/editing safehouses
- Import `useCreateSafehouse`, `useUpdateSafehouse` from hooks (already exist)
- Fields: name, region, city, province, status, capacity_girls, capacity_staff

### 8. `ResidentDetailPage.tsx` (Optional Enhancement)

The detail page currently shows tabs for Recordings, Home Visits, Education, Health, Interventions, Incidents — all read-only.

**Optional:** Add an "Edit Resident" button at the top of the detail page that opens a sheet/modal to edit the resident's core fields. This is the most natural place users would expect to edit a resident.

---

## Backend: Missing Delete Endpoints

The case doc says admin should be able to "in rare cases delete data." Currently, Process Recordings, Home Visitations, Education Records, Health Records, and Intervention Plans have no DELETE endpoints.

**Decision:** Do NOT add delete endpoints for these entities. The case doc says delete for these is not expected ("enter and view" / "log and view"). The Integrity rubric point ("confirmation to delete data") is satisfied by the existing delete flows on Supporters, Donations, Residents, Partners, Safehouses, Incident Reports, and Users — all of which use `DeleteConfirmDialog`.

---

## Testing the Rubric

After implementation, verify:

1. **RBAC - Only admin can CUD (1.5 pts):** All CUD endpoints have `[Authorize(Roles = "Admin")]`. A Staff user should be able to Read but not Create/Update/Delete (verify with a non-admin account).
2. **Integrity - Confirmation to delete (1 pt):** Every delete button opens `DeleteConfirmDialog` which requires typing the item name. No delete happens without confirmation.

---

## Files to Modify

| File | Changes |
|---|---|
| `frontend/src/pages/admin/DonorsPage.tsx` | Add Actions column, wire edit/delete, add trigger for existing delete dialog |
| `frontend/src/pages/admin/DonationsPage.tsx` | Add Actions column, wire edit/delete, add DeleteConfirmDialog |
| `frontend/src/pages/admin/ResidentsPage.tsx` | Add Actions column, wire edit/delete, add DeleteConfirmDialog |
| `frontend/src/pages/admin/ProcessRecordingsPage.tsx` | Add Actions column, wire edit only |
| `frontend/src/pages/admin/HomeVisitationsPage.tsx` | Add Actions column, wire edit only |
| `frontend/src/pages/admin/PartnersPage.tsx` | Add Actions column, wire edit, add trigger for existing delete dialog |
| `frontend/src/pages/admin/SafehousesPage.tsx` | Add create/edit Sheet form, Add Safehouse button |

---

## Checklist

- [ ] `DonorsPage.tsx` — Wire Actions column with Edit + Delete triggers (fix dead delete code)
- [ ] `DonationsPage.tsx` — Add Actions column, DeleteConfirmDialog, wire edit/delete
- [ ] `ResidentsPage.tsx` — Add Actions column, DeleteConfirmDialog, wire edit/delete (CRITICAL)
- [ ] `ProcessRecordingsPage.tsx` — Add Actions column with Edit only
- [ ] `HomeVisitationsPage.tsx` — Add Actions column with Edit only
- [ ] `PartnersPage.tsx` — Wire Actions column with Edit + Delete triggers (fix dead delete code)
- [ ] `SafehousesPage.tsx` — Add Create + Edit sheet form
- [ ] All deletes use `DeleteConfirmDialog` with type-to-confirm
- [ ] All edit flows reuse the existing create sheet, pre-populated
- [ ] Verify frontend builds cleanly
- [ ] Verify both create and update work end-to-end via the same form
