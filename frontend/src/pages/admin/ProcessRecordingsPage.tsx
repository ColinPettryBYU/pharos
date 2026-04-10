import { useState, useEffect, useMemo } from "react";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProcessRecordings, useCreateProcessRecording, useUpdateProcessRecording } from "@/hooks/useProcessRecordings";
import { fmtDate } from "@/lib/utils";
import type { ProcessRecording } from "@/types";
import { Plus, MoreHorizontal, Pencil, CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const recordingSchema = z.object({
  ResidentId: z.coerce.number().min(1, "Resident is required"),
  SessionDate: z.string().min(1, "Session date is required"),
  SocialWorker: z.string().min(1, "Social worker is required"),
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

export default function ProcessRecordingsPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProcessRecording | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  const { data, isLoading, error, refetch } = useProcessRecordings({
    pageSize: 3000,
    ...(typeFilter !== "all" ? { sessionType: typeFilter } : {}),
  });
  const createRecording = useCreateProcessRecording();
  const updateRecording = useUpdateProcessRecording();

  const rawRecordings = Array.isArray(data) ? data : (data?.data ?? []);
  const recordings = useMemo(
    () => sortOrder === "oldest" ? [...rawRecordings].reverse() : rawRecordings,
    [rawRecordings, sortOrder],
  );

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<RecordingForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recordingSchema) as any,
    defaultValues: {
      ResidentId: 0, SessionDate: today, SocialWorker: "",
      SessionType: "", SessionDurationMinutes: 45,
      EmotionalStateObserved: "", EmotionalStateEnd: "",
      SessionNarrative: "", InterventionsApplied: "", FollowUpActions: "",
      ProgressNoted: false, ConcernsFlagged: false, ReferralMade: false,
    },
  });

  useEffect(() => {
    if (editTarget) {
      form.reset({
        ResidentId: editTarget.resident_id,
        SessionDate: editTarget.session_date ? editTarget.session_date.split("T")[0] : today,
        SocialWorker: editTarget.social_worker || "",
        SessionType: editTarget.session_type || "",
        SessionDurationMinutes: editTarget.session_duration_minutes || 45,
        EmotionalStateObserved: editTarget.emotional_state_observed || "",
        EmotionalStateEnd: editTarget.emotional_state_end || "",
        SessionNarrative: editTarget.session_narrative || "",
        InterventionsApplied: editTarget.interventions_applied || "",
        FollowUpActions: editTarget.follow_up_actions || "",
        ProgressNoted: editTarget.progress_noted ?? false,
        ConcernsFlagged: editTarget.concerns_flagged ?? false,
        ReferralMade: editTarget.referral_made ?? false,
      });
    }
  }, [editTarget, form, today]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        ProgressNoted: values.ProgressNoted ? "True" : "",
        ConcernsFlagged: values.ConcernsFlagged ? "True" : "",
      };
      if (editTarget) {
        await updateRecording.mutateAsync({ id: editTarget.recording_id, data: payload as unknown as Record<string, unknown> });
        toast.success("Recording updated successfully");
      } else {
        await createRecording.mutateAsync(payload as unknown as Record<string, unknown>);
        toast.success("Session recorded successfully");
      }
      form.reset();
      setSheetOpen(false);
      setEditTarget(null);
    } catch { /* handled by api client */ }
  });

  const columns: ColumnDef<ProcessRecording>[] = useMemo(() => [
    {
      accessorKey: "session_date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="tabular-nums text-sm font-medium">{fmtDate(row.getValue("session_date"))}</span>
        </div>
      ),
    },
    {
      accessorKey: "resident_id",
      header: "Resident ID",
      cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.getValue("resident_id")}</span>,
    },
    {
      accessorKey: "social_worker",
      header: "Social Worker",
      cell: ({ row }) => <span className="text-sm">{row.getValue("social_worker")}</span>,
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
    {
      id: "actions",
      cell: ({ row }) => {
        const recording = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditTarget(recording); setSheetOpen(true); }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
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
        <p className="text-muted-foreground mb-4">Failed to load recordings</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const isPending = editTarget ? updateRecording.isPending : createRecording.isPending;

  return (
    <div>
      <PageHeader
        title="Process Recordings"
        description="Chronological counseling session notes across all residents."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Process Recordings" }]}
        actions={
          <Button onClick={() => { setEditTarget(null); form.reset({ ResidentId: 0, SessionDate: today, SocialWorker: "", SessionType: "", SessionDurationMinutes: 45, EmotionalStateObserved: "", EmotionalStateEnd: "", SessionNarrative: "", InterventionsApplied: "", FollowUpActions: "", ProgressNoted: false, ConcernsFlagged: false, ReferralMade: false }); setSheetOpen(true); }} className="gap-2">
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
          onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}?tab=recordings`)}
          filterComponent={
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Session Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Group">Group</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder((v as "latest" | "oldest") ?? "latest")}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { setEditTarget(null); form.reset(); } }}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Recording" : "Record Session"}</SheetTitle>
            <SheetDescription>{editTarget ? "Update session details." : "Document a counseling session with dated notes."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Resident ID <span className="text-destructive">*</span></Label>
                <Input type="number" {...form.register("ResidentId")} placeholder="Resident ID" />
              </div>
              <div className="space-y-2">
                <Label>Session Date <span className="text-destructive">*</span></Label>
                <Input type="date" {...form.register("SessionDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Social Worker <span className="text-destructive">*</span></Label>
              <Input {...form.register("SocialWorker")} placeholder="Name of social worker" />
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : editTarget ? "Update Recording" : "Save Recording"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
