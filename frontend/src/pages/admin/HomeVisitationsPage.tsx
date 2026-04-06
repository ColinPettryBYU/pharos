import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { mockHomeVisitations, mockInterventionPlans } from "@/lib/mock-data";
import type { HomeVisitation } from "@/types";
import { format, isFuture } from "date-fns";
import { Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const columns: ColumnDef<HomeVisitation>[] = [
  {
    accessorKey: "visit_date",
    header: "Date",
    cell: ({ row }) => <span className="tabular-nums text-sm">{format(new Date(row.getValue("visit_date")), "MMM d, yyyy")}</span>,
  },
  {
    accessorKey: "resident_id",
    header: "Resident",
    cell: ({ row }) => <span className="font-medium text-sm">R-{String(row.getValue("resident_id")).padStart(3, "0")}</span>,
  },
  {
    accessorKey: "social_worker",
    header: "Social Worker",
  },
  {
    accessorKey: "visit_type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.getValue("visit_type")}</Badge>,
  },
  {
    accessorKey: "family_cooperation_level",
    header: "Cooperation",
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
      row.getValue("safety_concerns_noted") ? (
        <Badge variant="destructive" className="text-xs">Concern</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">OK</span>
      ),
  },
  {
    accessorKey: "follow_up_needed",
    header: "Follow-up",
    cell: ({ row }) =>
      row.getValue("follow_up_needed") ? (
        <Badge variant="outline" className="text-xs">Needed</Badge>
      ) : null,
  },
];

export default function HomeVisitationsPage() {
  const navigate = useNavigate();
  const upcomingConferences = mockInterventionPlans
    .filter((p) => p.case_conference_date && isFuture(new Date(p.case_conference_date)))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Home Visitations"
        description="Track all home visits and upcoming case conferences."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Home Visitations" },
        ]}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Log Visit
          </Button>
        }
      />

      {upcomingConferences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Upcoming Case Conferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingConferences.map((p) => (
                  <div key={p.plan_id} className="flex items-center gap-3 text-sm">
                    <span className="tabular-nums font-medium">
                      {format(new Date(p.case_conference_date!), "MMM d, yyyy")}
                    </span>
                    <Badge variant="outline">{p.plan_category}</Badge>
                    <span className="text-muted-foreground">Resident #{p.resident_id}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <DataTableWrapper
        columns={columns}
        data={mockHomeVisitations}
        searchKey="social_worker"
        searchPlaceholder="Search by social worker..."
        onRowClick={(row) => navigate(`/admin/residents/${row.resident_id}`)}
      />
    </div>
  );
}
