import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { mockPartners } from "@/lib/mock-data";
import type { Partner } from "@/types";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const columns: ColumnDef<Partner>[] = [
  {
    accessorKey: "partner_name",
    header: "Organization",
    cell: ({ row }) => <span className="font-medium">{row.getValue("partner_name")}</span>,
  },
  {
    accessorKey: "partner_type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("partner_type")}</Badge>,
  },
  {
    accessorKey: "contact_name",
    header: "Contact",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("email")}</span>,
  },
  {
    accessorKey: "region",
    header: "Region",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.getValue("status") === "Active" ? "default" : "secondary"} className="text-xs">
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "start_date",
    header: "Since",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {format(new Date(row.getValue("start_date")), "MMM yyyy")}
      </span>
    ),
  },
];

export default function PartnersPage() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [_deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  return (
    <div>
      <PageHeader
        title="Partners"
        description="Manage partner organizations and assignments."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Partners" },
        ]}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Partner
          </Button>
        }
      />
      <DataTableWrapper columns={columns} data={mockPartners} searchKey="partner_name" searchPlaceholder="Search partners..." />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          toast.success(`Partner deleted`);
          setDeleteOpen(false);
        }}
        itemName={_deleteTarget?.partner_name || ""}
      />
    </div>
  );
}
