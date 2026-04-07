import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useHomeVisitations, useCreateHomeVisitation } from "@/hooks/useHomeVisitations";
import { fmtDate } from "@/lib/utils";
import type { HomeVisitation } from "@/types";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const visitSchema = z.object({
  ResidentId: z.coerce.number().min(1, "Resident is required"),
  VisitType: z.string().min(1, "Visit type is required"),
  VisitDate: z.string().min(1, "Date is required"),
  LocationVisited: z.string().min(1, "Location is required"),
  FamilyMembersPresent: z.string().optional(),
  Purpose: z.string().min(1, "Purpose is required"),
  Observations: z.string().optional(),
  FamilyCooperationLevel: z.string().min(1, "Cooperation level is required"),
  SafetyConcernsNoted: z.boolean().default(false),
  FollowUpNeeded: z.boolean().default(false),
  FollowUpNotes: z.string().optional(),
  VisitOutcome: z.string().min(1, "Outcome is required"),
});

type VisitForm = z.infer<typeof visitSchema>;

const columns: ColumnDef<HomeVisitation>[] = [
  {
    accessorKey: "visit_date",
    header: "Date",
    cell: ({ row }) => <span className="tabular-nums text-sm">{fmtDate(row.getValue("visit_date"))}</span>,
  },
  {
    accessorKey: "resident_id",
    header: "Resident",
    cell: ({ row }) => <span className="font-medium text-sm">R-{String(row.getValue("resident_id")).padStart(3, "0")}</span>,
  },
  { accessorKey: "social_worker", header: "Social Worker" },
  {
    accessorKey: "visit_type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.getValue("visit_type")}</Badge>,
  },
  {
    accessorKey: "family_cooperation_level",
    header: "Family Cooperation",
    cell: ({ row }) => {
      const level = row.getValue("family_cooperation_level") as string;
      const color = level === "Highly Cooperative" ? "text-success" : level === "Uncooperative" ? "text-destructive" : "text-muted-foreground";
      return <span className={`text-sm ${color}`}>{level}</span>;
    },
  },
  {
    accessorKey: "visit_outcome",
    header: "Outcome",
    cell: ({ row }) => {
      const outcome = row.getValue("visit_outcome") as string;
      const variant = outcome === "Favorable" ? "default" : outcome === "Unfavorable" ? "destructive" : "secondary";
      return <Badge variant={variant} className="text-xs">{outcome}</Badge>;
    },
  },
  {
    accessorKey: "safety_concerns_noted",
    header: "Safety",
    cell: ({ row }) =>
      row.getValue("safety_concerns_noted") ? <Badge variant="destructive" className="text-xs">Concern</Badge> : <span className="text-xs text-muted-foreground">OK</span>,
  },
  {
    accessorKey: "follow_up_needed",
    header: "Follow-up",
    cell: ({ row }) =>
      row.getValue("follow_up_needed") ? <Badge variant="outline" className="text-xs">Needed</Badge> : null,
  },
];

export default function HomeVisitationsPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading, error, refetch } = useHomeVisitations();
  const createVisit = useCreateHomeVisitation();

  const visitations = Array.isArray(data) ? data : (data?.data ?? []);

  const form = useForm<VisitForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(visitSchema) as any,
    defaultValues: {
      ResidentId: 0, VisitType: "", VisitDate: "", LocationVisited: "",
      FamilyMembersPresent: "", Purpose: "", Observations: "",
      FamilyCooperationLevel: "", SafetyConcernsNoted: false,
      FollowUpNeeded: false, FollowUpNotes: "", VisitOutcome: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createVisit.mutateAsync(values as unknown as Record<string, unknown>);
      toast.success("Visit logged successfully");
      form.reset();
      setSheetOpen(false);
    } catch { /* handled by api client */ }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load home visitations</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Home Visitations"
        description="Track all home visits and family assessments."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Home Visitations" }]}
        actions={
          <Button onClick={() => setSheetOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Log Visit
          </Button>
        }
      />

      {!isLoading && visitations.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No home visitations yet</p>
          <p className="text-muted-foreground mb-4">Log the first visit to get started</p>
          <Button onClick={() => setSheetOpen(true)}>Log Visit</Button>
        </div>
      ) : (
        <DataTableWrapper
          columns={columns}
          data={visitations}
          searchKey="social_worker"
          searchPlaceholder="Search by social worker..."
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}`)}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Log Home Visit</SheetTitle>
            <SheetDescription>Document a home visitation.</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Resident ID <span className="text-destructive">*</span></Label><Input type="number" {...form.register("ResidentId")} /></div>
              <div className="space-y-2"><Label>Visit Date <span className="text-destructive">*</span></Label><Input type="date" {...form.register("VisitDate")} /></div>
            </div>
            <div className="space-y-2">
              <Label>Visit Type <span className="text-destructive">*</span></Label>
              <Select value={form.watch("VisitType") ?? ""} onValueChange={(v) => form.setValue("VisitType", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Initial Assessment">Initial Assessment</SelectItem>
                  <SelectItem value="Routine Follow-Up">Routine Follow-Up</SelectItem>
                  <SelectItem value="Reintegration Assessment">Reintegration Assessment</SelectItem>
                  <SelectItem value="Post-Placement Monitoring">Post-Placement Monitoring</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Location Visited <span className="text-destructive">*</span></Label><Input {...form.register("LocationVisited")} placeholder="Family residence..." /></div>
            <div className="space-y-2"><Label>Family Members Present</Label><Input {...form.register("FamilyMembersPresent")} placeholder="Mother, grandmother..." /></div>
            <div className="space-y-2"><Label>Purpose <span className="text-destructive">*</span></Label><Textarea {...form.register("Purpose")} rows={2} /></div>
            <div className="space-y-2"><Label>Observations</Label><Textarea {...form.register("Observations")} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Family Cooperation Level <span className="text-destructive">*</span></Label>
                <Select value={form.watch("FamilyCooperationLevel") ?? ""} onValueChange={(v) => form.setValue("FamilyCooperationLevel", v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Highly Cooperative">Highly Cooperative</SelectItem>
                    <SelectItem value="Cooperative">Cooperative</SelectItem>
                    <SelectItem value="Neutral">Neutral</SelectItem>
                    <SelectItem value="Uncooperative">Uncooperative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Outcome <span className="text-destructive">*</span></Label>
                <Select value={form.watch("VisitOutcome") ?? ""} onValueChange={(v) => form.setValue("VisitOutcome", v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Favorable">Favorable</SelectItem>
                    <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                    <SelectItem value="Unfavorable">Unfavorable</SelectItem>
                    <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.watch("SafetyConcernsNoted")} onCheckedChange={(v) => form.setValue("SafetyConcernsNoted", v)} /><Label>Safety concerns</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.watch("FollowUpNeeded")} onCheckedChange={(v) => form.setValue("FollowUpNeeded", v)} /><Label>Follow-up needed</Label></div>
            </div>
            {form.watch("FollowUpNeeded") && (
              <div className="space-y-2"><Label>Follow-up Notes</Label><Textarea {...form.register("FollowUpNotes")} rows={2} /></div>
            )}
            <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are required.</p>
            <Button type="submit" className="w-full" disabled={createVisit.isPending}>
              {createVisit.isPending ? "Saving..." : "Log Visit"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
