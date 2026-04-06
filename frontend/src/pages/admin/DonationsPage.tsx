import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { Button } from "@/components/ui/button";
import { mockDonations } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/api";
import type { Donation } from "@/types";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const columns: ColumnDef<Donation>[] = [
  {
    accessorKey: "donation_date",
    header: "Date",
    cell: ({ row }) => (
      <span className="tabular-nums">{format(new Date(row.getValue("donation_date")), "MMM d, yyyy")}</span>
    ),
  },
  {
    accessorKey: "supporter",
    header: "Donor",
    cell: ({ row }) => {
      const donor = row.original.supporter;
      return <span className="font-medium">{donor?.display_name || "Unknown"}</span>;
    },
  },
  {
    accessorKey: "donation_type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("donation_type")}</Badge>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">{formatCurrency(row.getValue("amount"))}</span>
    ),
  },
  {
    accessorKey: "campaign_name",
    header: "Campaign",
    cell: ({ row }) => row.getValue("campaign_name") || <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: "channel_source",
    header: "Channel",
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("channel_source")}</span>,
  },
  {
    accessorKey: "is_recurring",
    header: "Recurring",
    cell: ({ row }) =>
      row.getValue("is_recurring") ? (
        <Badge className="bg-success/10 text-success border-0">Yes</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">No</span>
      ),
  },
];

export default function DonationsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const filtered = typeFilter === "all" ? mockDonations : mockDonations.filter((d) => d.donation_type === typeFilter);

  return (
    <div>
      <PageHeader
        title="Donations"
        description="Track and manage all donations across campaigns."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Donations" },
        ]}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Log Donation
          </Button>
        }
      />

      <DataTableWrapper
        columns={columns}
        data={filtered}
        searchKey="campaign_name"
        searchPlaceholder="Search by campaign..."
        filterComponent={
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Monetary">Monetary</SelectItem>
              <SelectItem value="InKind">In-Kind</SelectItem>
              <SelectItem value="Time">Time</SelectItem>
              <SelectItem value="Skills">Skills</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
