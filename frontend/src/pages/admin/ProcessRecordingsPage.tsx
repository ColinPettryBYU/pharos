import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { EmotionalStateIndicator } from "@/components/shared/EmotionalStateIndicator";
import { Button } from "@/components/ui/button";
import { mockProcessRecordings } from "@/lib/mock-data";
import type { ProcessRecording } from "@/types";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const columns: ColumnDef<ProcessRecording>[] = [
  {
    accessorKey: "session_date",
    header: "Date",
    cell: ({ row }) => <span className="tabular-nums text-sm">{format(new Date(row.getValue("session_date")), "MMM d, yyyy")}</span>,
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
    cell: ({ row }) => (
      <EmotionalStateIndicator
        start={row.original.emotional_state_observed}
        end={row.original.emotional_state_end}
      />
    ),
  },
  {
    accessorKey: "progress_noted",
    header: "Progress",
    cell: ({ row }) =>
      row.getValue("progress_noted") ? (
        <Badge className="bg-success/10 text-success border-0 text-xs">Yes</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "concerns_flagged",
    header: "Concerns",
    cell: ({ row }) =>
      row.getValue("concerns_flagged") ? (
        <Badge variant="destructive" className="text-xs">Flagged</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      ),
  },
];

export default function ProcessRecordingsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Process Recordings"
        description="All counseling sessions across residents."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Process Recordings" },
        ]}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Record Session
          </Button>
        }
      />
      <DataTableWrapper
        columns={columns}
        data={mockProcessRecordings}
        searchKey="social_worker"
        searchPlaceholder="Search by social worker..."
        onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}`)}
      />
    </div>
  );
}
