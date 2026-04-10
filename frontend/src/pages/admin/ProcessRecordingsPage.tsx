import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Plus, MoreHorizontal, Pencil, Filter, X, CalendarIcon } from "lucide-react";
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
const ALL_VALUE = "__all__";

export default function ProcessRecordingsPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProcessRecording | null>(null);

  // Filter state
  const [filterResidentId, setFilterResidentId] = useState("");
  const [filterSessionType, setFilterSessionType] = useState("");
  const [filterSocialWorker, setFilterSocialWorker] = useState("");
  const [filterEmotionalState, setFilterEmotionalState] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterConcerns, setFilterConcerns] = useState("");
  const [filterProgress, setFilterProgress] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);

  const filters = useMemo(() => {
    const f: Record<string, unknown> = { pageSize: 3000 };
    if (filterResidentId) f.residentId = Number(filterResidentId);
    if (filterSessionType) f.sessionType = filterSessionType;
    if (filterSocialWorker) f.search = filterSocialWorker;
    if (filterEmotionalState) f.emotionalState = filterEmotionalState;
    if (filterStartDate) f.startDate = filterStartDate;
    if (filterEndDate) f.endDate = filterEndDate;
    if (filterConcerns === "yes") f.concernsFlagged = true;
    if (filterConcerns === "no") f.concernsFlagged = false;
    if (filterProgress === "yes") f.progressNoted = true;
    if (filterProgress === "no") f.progressNoted = false;
    return f;
  }, [filterResidentId, filterSessionType, filterSocialWorker, filterEmotionalState, filterStartDate, filterEndDate, filterConcerns, filterProgress]);

  const { data, isLoading, error, refetch } = useProcessRecordings(filters);
  const createRecording = useCreateProcessRecording();
  const updateRecording = useUpdateProcessRecording();

  const recordings = Array.isArray(data) ? data : (data?.data ?? []);

  const activeFilterCount = [filterResidentId, filterSessionType, filterSocialWorker, filterEmotionalState, filterStartDate, filterEndDate, filterConcerns, filterProgress].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setFilterResidentId("");
    setFilterSessionType("");
    setFilterSocialWorker("");
    setFilterEmotionalState("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterConcerns("");
    setFilterProgress("");
  }, []);

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

  const filterBar = (
    <div className="space-y-3">
      {/* Toggle + active count */}
      <div className="flex items-center gap-2">
        <Button
          variant={filtersVisible ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeFilterCount}</Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground text-xs">
            <X className="h-3 w-3" /> Clear all
          </Button>
        )}
      </div>

      {/* Filter fields */}
      {filtersVisible && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Resident ID</Label>
            <Input
              type="number"
              placeholder="Any"
              value={filterResidentId}
              onChange={(e) => setFilterResidentId(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Session Type</Label>
            <Select value={filterSessionType || ALL_VALUE} onValueChange={(v) => setFilterSessionType(!v || v === ALL_VALUE ? "" : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Any</SelectItem>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Social Worker</Label>
            <Input
              placeholder="Search..."
              value={filterSocialWorker}
              onChange={(e) => setFilterSocialWorker(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Emotional State</Label>
            <Select value={filterEmotionalState || ALL_VALUE} onValueChange={(v) => setFilterEmotionalState(!v || v === ALL_VALUE ? "" : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Any</SelectItem>
                {emotionalStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Concerns Flagged</Label>
            <Select value={filterConcerns || ALL_VALUE} onValueChange={(v) => setFilterConcerns(!v || v === ALL_VALUE ? "" : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Any</SelectItem>
                <SelectItem value="yes">Flagged</SelectItem>
                <SelectItem value="no">Not Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Progress Noted</Label>
            <Select value={filterProgress || ALL_VALUE} onValueChange={(v) => setFilterProgress(!v || v === ALL_VALUE ? "" : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Any</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );

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

      {!isLoading && recordings.length === 0 && activeFilterCount === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No recordings yet</p>
          <p className="text-muted-foreground mb-4">Record the first session to get started</p>
          <Button onClick={() => setSheetOpen(true)}>Record Session</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filterBar}
          <DataTableWrapper
            columns={columns}
            data={recordings}
            searchKey="social_worker"
            searchPlaceholder="Search by social worker or narrative..."
            isLoading={isLoading}
            onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}?tab=recordings`)}
          />
        </div>
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
