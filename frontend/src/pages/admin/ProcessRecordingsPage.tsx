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
import { EmotionalStateIndicator } from "@/components/shared/EmotionalStateIndicator";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProcessRecordings, useCreateProcessRecording } from "@/hooks/useProcessRecordings";
import { fmtDate } from "@/lib/utils";
import type { ProcessRecording } from "@/types";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const recordingSchema = z.object({
  ResidentId: z.coerce.number().min(1, "Resident is required"),
  SessionType: z.string().min(1, "Session type is required"),
  SessionDurationMinutes: z.coerce.number().min(1, "Duration is required"),
  EmotionalStateObserved: z.string().min(1, "Starting emotional state is required"),
  EmotionalStateEnd: z.string().min(1, "Ending emotional state is required"),
  SessionNarrative: z.string().min(1, "Narrative is required"),
  InterventionsApplied: z.string().optional(),
  FollowUpActions: z.string().optional(),
  ProgressNoted: z.boolean().default(false),
  ConcernsFlagged: z.boolean().default(false),
  ReferralMade: z.boolean().default(false),
});

type RecordingForm = z.infer<typeof recordingSchema>;

const emotionalStates = ["Calm", "Anxious", "Sad", "Angry", "Hopeful", "Withdrawn", "Happy", "Distressed"];

const columns: ColumnDef<ProcessRecording>[] = [
  {
    accessorKey: "session_date",
    header: "Date",
    cell: ({ row }) => <span className="tabular-nums text-sm">{fmtDate(row.getValue("session_date"))}</span>,
  },
  {
    accessorKey: "resident_id",
    header: "Resident",
    cell: ({ row }) => <span className="font-medium text-sm">R-{String(row.getValue("resident_id")).padStart(3, "0")}</span>,
  },
  {
    accessorKey: "social_worker",
    header: "Social Worker",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("social_worker")}</span>,
  },
  {
    accessorKey: "session_type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("session_type")}</Badge>,
  },
  {
    accessorKey: "session_duration_minutes",
    header: "Duration",
    cell: ({ row }) => <span className="text-sm tabular-nums">{row.getValue("session_duration_minutes")} min</span>,
  },
  {
    id: "emotional",
    header: "Emotional State",
    cell: ({ row }) => <EmotionalStateIndicator start={row.original.emotional_state_observed} end={row.original.emotional_state_end} />,
  },
  {
    accessorKey: "progress_noted",
    header: "Progress",
    cell: ({ row }) =>
      row.getValue("progress_noted") ? <Badge className="bg-success/10 text-success border-0 text-xs">Yes</Badge> : <span className="text-xs text-muted-foreground">-</span>,
  },
  {
    accessorKey: "concerns_flagged",
    header: "Concerns",
    cell: ({ row }) =>
      row.getValue("concerns_flagged") ? <Badge variant="destructive" className="text-xs">Flagged</Badge> : <span className="text-xs text-muted-foreground">-</span>,
  },
];

export default function ProcessRecordingsPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading, error, refetch } = useProcessRecordings({ pageSize: 3000 });
  const createRecording = useCreateProcessRecording();

  const recordings = Array.isArray(data) ? data : (data?.data ?? []);

  const form = useForm<RecordingForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recordingSchema) as any,
    defaultValues: {
      ResidentId: 0, SessionType: "", SessionDurationMinutes: 45,
      EmotionalStateObserved: "", EmotionalStateEnd: "",
      SessionNarrative: "", InterventionsApplied: "", FollowUpActions: "",
      ProgressNoted: false, ConcernsFlagged: false, ReferralMade: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createRecording.mutateAsync(values as unknown as Record<string, unknown>);
      toast.success("Session recorded successfully");
      form.reset();
      setSheetOpen(false);
    } catch { /* handled by api client */ }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load recordings</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Process Recordings"
        description="All counseling sessions across residents."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Process Recordings" }]}
        actions={
          <Button onClick={() => setSheetOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Record Session
          </Button>
        }
      />

      {!isLoading && recordings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No recordings yet</p>
          <p className="text-muted-foreground mb-4">Record the first session to get started</p>
          <Button onClick={() => setSheetOpen(true)}>Record Session</Button>
        </div>
      ) : (
        <DataTableWrapper
          columns={columns}
          data={recordings}
          searchKey="social_worker"
          searchPlaceholder="Search by social worker..."
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}`)}
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Record Session</SheetTitle>
            <SheetDescription>Document a counseling session.</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Resident ID <span className="text-destructive">*</span></Label>
              <Input type="number" {...form.register("ResidentId")} placeholder="Resident ID" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Session Type <span className="text-destructive">*</span></Label>
                <Select value={form.watch("SessionType") ?? ""} onValueChange={(v) => form.setValue("SessionType", v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (min) <span className="text-destructive">*</span></Label>
                <Input type="number" {...form.register("SessionDurationMinutes")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Starting State <span className="text-destructive">*</span></Label>
                <Select value={form.watch("EmotionalStateObserved") ?? ""} onValueChange={(v) => form.setValue("EmotionalStateObserved", v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {emotionalStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ending State <span className="text-destructive">*</span></Label>
                <Select value={form.watch("EmotionalStateEnd") ?? ""} onValueChange={(v) => form.setValue("EmotionalStateEnd", v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {emotionalStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Session Narrative <span className="text-destructive">*</span></Label>
              <Textarea {...form.register("SessionNarrative")} rows={4} placeholder="Describe the session..." />
            </div>
            <div className="space-y-2">
              <Label>Interventions Applied</Label>
              <Textarea {...form.register("InterventionsApplied")} rows={2} placeholder="List interventions..." />
            </div>
            <div className="space-y-2">
              <Label>Follow-up Actions</Label>
              <Textarea {...form.register("FollowUpActions")} rows={2} placeholder="Required follow-ups..." />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.watch("ProgressNoted")} onCheckedChange={(v) => form.setValue("ProgressNoted", v)} /><Label>Progress noted</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.watch("ConcernsFlagged")} onCheckedChange={(v) => form.setValue("ConcernsFlagged", v)} /><Label>Concerns</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.watch("ReferralMade")} onCheckedChange={(v) => form.setValue("ReferralMade", v)} /><Label>Referral</Label></div>
            </div>
            <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are required.</p>
            <Button type="submit" className="w-full" disabled={createRecording.isPending}>
              {createRecording.isPending ? "Saving..." : "Save Recording"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
