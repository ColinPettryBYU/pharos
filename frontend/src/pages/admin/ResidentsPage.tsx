import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { mockResidents } from "@/lib/mock-data";
import type { Resident } from "@/types";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const columns: ColumnDef<Resident>[] = [
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
      return (
        <Badge variant={status === "Active" ? "default" : "secondary"} className="text-xs">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "case_category",
    header: "Category",
  },
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
        {format(new Date(row.getValue("date_of_admission")), "MMM d, yyyy")}
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
];

export default function ResidentsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  let filtered = mockResidents;
  if (statusFilter !== "all") filtered = filtered.filter((r) => r.case_status === statusFilter);
  if (riskFilter !== "all") filtered = filtered.filter((r) => r.current_risk_level === riskFilter);

  return (
    <div>
      <PageHeader
        title="Caseload Inventory"
        description="Manage all resident cases across safehouses."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Caseload" },
        ]}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Resident
          </Button>
        }
      />

      <DataTableWrapper
        columns={columns}
        data={filtered}
        searchKey="case_control_no"
        searchPlaceholder="Search by case no..."
        onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}`)}
        filterComponent={
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v ?? "all")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
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
    </div>
  );
}
