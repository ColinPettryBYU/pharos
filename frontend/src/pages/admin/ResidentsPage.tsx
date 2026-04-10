import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResidents, useCreateResident, useUpdateResident, useDeleteResident } from "@/hooks/useResidents";
import type { Resident } from "@/types";
import { fmtDate } from "@/lib/utils";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const residentSchema = z.object({
  CaseControlNo: z.string().min(1, "Case control number is required"),
  InternalCode: z.string().min(1, "Internal code is required"),
  SafehouseId: z.coerce.number().min(1, "Safehouse is required"),
  CaseStatus: z.string().min(1, "Status is required"),
  CaseCategory: z.string().min(1, "Category is required"),
  Sex: z.string().default("Female"),
  DateOfBirth: z.string().min(1, "Date of birth is required"),
  BirthStatus: z.string().optional(),
  PlaceOfBirth: z.string().optional(),
  Religion: z.string().optional(),
  ReferralSource: z.string().optional(),
  ReferringAgencyPerson: z.string().optional(),
  DateOfAdmission: z.string().min(1, "Admission date is required"),
  AssignedSocialWorker: z.string().optional(),
  ReintegrationType: z.string().default("None"),
  ReintegrationStatus: z.string().default("Not Started"),
  InitialRiskLevel: z.string().default("Medium"),
  SubCatOrphaned: z.boolean().default(false),
  SubCatTrafficked: z.boolean().default(false),
  SubCatChildLabor: z.boolean().default(false),
  SubCatPhysicalAbuse: z.boolean().default(false),
  SubCatSexualAbuse: z.boolean().default(false),
  SubCatAtRisk: z.boolean().default(false),
  IsPwd: z.boolean().default(false),
  HasSpecialNeeds: z.boolean().default(false),
});

type ResidentForm = z.infer<typeof residentSchema>;

export default function ResidentsPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [editTarget, setEditTarget] = useState<Resident | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null);

  const { data, isLoading, error, refetch } = useResidents({
    ...(statusFilter !== "all" ? { caseStatus: statusFilter } : {}),
    ...(riskFilter !== "all" ? { riskLevel: riskFilter } : {}),
  });
  const createResident = useCreateResident();
  const updateResident = useUpdateResident();
  const deleteResidentMut = useDeleteResident();

  const residents = Array.isArray(data) ? data : (data?.data ?? []);

  const form = useForm<ResidentForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(residentSchema) as any,
    defaultValues: {
      CaseControlNo: "", InternalCode: "", SafehouseId: 0, CaseStatus: "Active",
      CaseCategory: "", Sex: "Female", DateOfBirth: "", DateOfAdmission: "",
      ReintegrationType: "None", ReintegrationStatus: "Not Started", InitialRiskLevel: "Medium",
      SubCatOrphaned: false, SubCatTrafficked: false, SubCatChildLabor: false,
      SubCatPhysicalAbuse: false, SubCatSexualAbuse: false, SubCatAtRisk: false,
      IsPwd: false, HasSpecialNeeds: false,
    },
  });

  useEffect(() => {
    if (editTarget) {
      form.reset({
        CaseControlNo: editTarget.case_control_no || "",
        InternalCode: editTarget.internal_code || "",
        SafehouseId: editTarget.safehouse_id,
        CaseStatus: editTarget.case_status || "Active",
        CaseCategory: editTarget.case_category || "",
        Sex: editTarget.sex || "Female",
        DateOfBirth: editTarget.date_of_birth ? editTarget.date_of_birth.split("T")[0] : "",
        DateOfAdmission: editTarget.date_of_admission ? editTarget.date_of_admission.split("T")[0] : "",
        BirthStatus: editTarget.birth_status || "",
        PlaceOfBirth: editTarget.place_of_birth || "",
        Religion: editTarget.religion || "",
        ReferralSource: editTarget.referral_source || "",
        ReferringAgencyPerson: editTarget.referring_agency_person || "",
        AssignedSocialWorker: editTarget.assigned_social_worker || "",
        ReintegrationType: editTarget.reintegration_type || "None",
        ReintegrationStatus: editTarget.reintegration_status || "Not Started",
        InitialRiskLevel: editTarget.initial_risk_level || "Medium",
        SubCatOrphaned: editTarget.sub_cat_orphaned ?? false,
        SubCatTrafficked: editTarget.sub_cat_trafficked ?? false,
        SubCatChildLabor: editTarget.sub_cat_child_labor ?? false,
        SubCatPhysicalAbuse: editTarget.sub_cat_physical_abuse ?? false,
        SubCatSexualAbuse: editTarget.sub_cat_sexual_abuse ?? false,
        SubCatAtRisk: editTarget.sub_cat_at_risk ?? false,
        IsPwd: editTarget.is_pwd ?? false,
        HasSpecialNeeds: editTarget.has_special_needs ?? false,
      });
    }
  }, [editTarget, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editTarget) {
        await updateResident.mutateAsync({ id: editTarget.resident_id, data: values as unknown as Record<string, unknown> });
        toast.success("Resident updated successfully");
      } else {
        await createResident.mutateAsync(values as unknown as Record<string, unknown>);
        toast.success("Resident added successfully");
      }
      form.reset();
      setSheetOpen(false);
      setEditTarget(null);
    } catch { /* handled by api client */ }
  });

  const columns: ColumnDef<Resident>[] = useMemo(() => [
    {
      accessorKey: "resident_id",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.getValue("resident_id")}</span>,
    },
    {
      accessorKey: "case_control_no",
      header: "Case No.",
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.getValue("case_control_no")}</span>,
    },
    {
      accessorKey: "internal_code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.getValue("internal_code")}</span>,
    },
    {
      accessorKey: "safehouse",
      header: "Safehouse",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.safehouse?.safehouse_code || `SH-${row.original.safehouse_id}`}
        </Badge>
      ),
    },
    {
      accessorKey: "case_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("case_status") as string;
        return <Badge variant={status === "Active" ? "default" : "secondary"} className="text-xs">{status}</Badge>;
      },
    },
    { accessorKey: "case_category", header: "Category" },
    {
      accessorKey: "current_risk_level",
      header: "Risk Level",
      cell: ({ row }) => <RiskBadge level={row.getValue("current_risk_level")} />,
    },
    {
      accessorKey: "present_age",
      header: "Age",
      cell: ({ row }) => <span className="tabular-nums">{row.getValue("present_age")}</span>,
    },
    {
      accessorKey: "date_of_admission",
      header: "Admitted",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {fmtDate(row.getValue("date_of_admission"))}
        </span>
      ),
    },
    {
      accessorKey: "assigned_social_worker",
      header: "Social Worker",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("assigned_social_worker")}</span>,
    },
    {
      accessorKey: "reintegration_status",
      header: "Reintegration",
      cell: ({ row }) => {
        const status = row.getValue("reintegration_status") as string;
        const colors: Record<string, string> = {
          "Not Started": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
          "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
          "Completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
          "On Hold": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
        };
        return <Badge variant="outline" className={`border-0 text-xs ${colors[status] || ""}`}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const resident = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditTarget(resident); setSheetOpen(true); }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => { setDeleteTarget(resident); setDeleteOpen(true); }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load residents</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const isPending = editTarget ? updateResident.isPending : createResident.isPending;

  return (
    <div>
      <PageHeader
        title="Caseload Inventory"
        description="Manage all resident cases across safehouses."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Caseload" }]}
        actions={
          <Button onClick={() => { setEditTarget(null); form.reset(); setSheetOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />Add Resident
          </Button>
        }
      />

      {!isLoading && residents.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No residents yet</p>
          <p className="text-muted-foreground mb-4">Add the first resident to get started</p>
          <Button onClick={() => setSheetOpen(true)}>Add Resident</Button>
        </div>
      ) : (
        <DataTableWrapper
          columns={columns}
          data={residents}
          searchKey="case_control_no"
          searchPlaceholder="Search by case no..."
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}`)}
          filterComponent={
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v ?? "all")}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { setEditTarget(null); form.reset(); } }}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Resident" : "Add New Resident"}</SheetTitle>
            <SheetDescription>{editTarget ? "Update resident profile information." : "Intake a new resident into the system."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3">Case Information</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Case Control No.</Label><Input {...form.register("CaseControlNo")} placeholder="CC-2024-0001" /></div>
                  <div className="space-y-1"><Label>Internal Code</Label><Input {...form.register("InternalCode")} placeholder="R-001" /></div>
                </div>
                <div className="space-y-1">
                  <Label>Safehouse ID</Label>
                  <Input type="number" {...form.register("SafehouseId")} placeholder="Safehouse ID" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={form.watch("CaseStatus") ?? ""} onValueChange={(v) => form.setValue("CaseStatus", v ?? "")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Transferred">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Select value={form.watch("CaseCategory") ?? ""} onValueChange={(v) => form.setValue("CaseCategory", v ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Abandoned">Abandoned</SelectItem>
                        <SelectItem value="Foundling">Foundling</SelectItem>
                        <SelectItem value="Surrendered">Surrendered</SelectItem>
                        <SelectItem value="Neglected">Neglected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Demographics</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" {...form.register("DateOfBirth")} /></div>
                  <div className="space-y-1"><Label>Date of Admission</Label><Input type="date" {...form.register("DateOfAdmission")} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Place of Birth</Label><Input {...form.register("PlaceOfBirth")} /></div>
                  <div className="space-y-1"><Label>Religion</Label><Input {...form.register("Religion")} /></div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Sub-categories</h4>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ["SubCatOrphaned", "Orphaned"], ["SubCatTrafficked", "Trafficked"],
                  ["SubCatChildLabor", "Child Labor"], ["SubCatPhysicalAbuse", "Physical Abuse"],
                  ["SubCatSexualAbuse", "Sexual Abuse"], ["SubCatAtRisk", "At Risk"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch checked={form.watch(key)} onCheckedChange={(v) => form.setValue(key, v)} />
                    <Label className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Referral & Risk</h4>
              <div className="space-y-3">
                <div className="space-y-1"><Label>Referral Source</Label><Input {...form.register("ReferralSource")} /></div>
                <div className="space-y-1"><Label>Assigned Social Worker</Label><Input {...form.register("AssignedSocialWorker")} /></div>
                <div className="space-y-1">
                  <Label>Initial Risk Level</Label>
                  <Select value={form.watch("InitialRiskLevel") ?? ""} onValueChange={(v) => form.setValue("InitialRiskLevel", v ?? "")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editTarget && (
                  <div className="space-y-1">
                    <Label>Reintegration Status</Label>
                    <Select value={form.watch("ReintegrationStatus") ?? ""} onValueChange={(v) => form.setValue("ReintegrationStatus", v ?? "")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : editTarget ? "Update Resident" : "Add Resident"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget?.case_control_no || ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteResidentMut.mutateAsync(deleteTarget.resident_id);
            toast.success("Resident deleted");
            setDeleteOpen(false);
            setDeleteTarget(null);
          }
        }}
        loading={deleteResidentMut.isPending}
      />
    </div>
  );
}
