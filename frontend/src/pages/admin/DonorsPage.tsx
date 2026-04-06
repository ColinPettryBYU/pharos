import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockSupporters } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/api";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Supporter, RiskLevel } from "@/types";
import { format } from "date-fns";

const columns: ColumnDef<Supporter>[] = [
  {
    accessorKey: "display_name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("display_name")}</span>
    ),
  },
  {
    accessorKey: "supporter_type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue("supporter_type")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={status === "Active" ? "default" : "secondary"}
          className="text-xs"
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "acquisition_channel",
    header: "Channel",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("acquisition_channel")}
      </span>
    ),
  },
  {
    accessorKey: "first_donation_date",
    header: "First Donation",
    cell: ({ row }) => {
      const date = row.getValue("first_donation_date") as string;
      return (
        <span className="text-sm text-muted-foreground tabular-nums">
          {date ? format(new Date(date), "MMM d, yyyy") : "N/A"}
        </span>
      );
    },
  },
  {
    accessorKey: "churn_risk",
    header: "Churn Risk",
    cell: ({ row }) => {
      const risk = row.getValue("churn_risk") as number;
      const level: RiskLevel =
        risk < 25 ? "Low" : risk < 50 ? "Medium" : risk < 75 ? "High" : "Critical";
      return <RiskBadge level={level} />;
    },
  },
];

export default function DonorsPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered =
    typeFilter === "all"
      ? mockSupporters
      : mockSupporters.filter((s) => s.supporter_type === typeFilter);

  return (
    <div>
      <PageHeader
        title="Supporters"
        description="Manage donors, volunteers, and partner organizations."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Supporters" },
        ]}
        actions={
          <Button onClick={() => setSheetOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Supporter
          </Button>
        }
      />

      <DataTableWrapper
        columns={columns}
        data={filtered}
        searchKey="display_name"
        searchPlaceholder="Search supporters..."
        onRowClick={(row) => navigate(`/admin/donors/${row.supporter_id}`)}
        filterComponent={
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="MonetaryDonor">Monetary Donor</SelectItem>
              <SelectItem value="InKindDonor">In-Kind Donor</SelectItem>
              <SelectItem value="Volunteer">Volunteer</SelectItem>
              <SelectItem value="SkillsContributor">Skills</SelectItem>
              <SelectItem value="SocialMediaAdvocate">Social Media</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Add Supporter Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Add New Supporter</SheetTitle>
            <SheetDescription>
              Add a new donor, volunteer, or partner.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input placeholder="Display name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Supporter Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MonetaryDonor">Monetary Donor</SelectItem>
                  <SelectItem value="InKindDonor">In-Kind Donor</SelectItem>
                  <SelectItem value="Volunteer">Volunteer</SelectItem>
                  <SelectItem value="SkillsContributor">Skills Contributor</SelectItem>
                  <SelectItem value="SocialMediaAdvocate">Social Media Advocate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Acquisition Channel</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="SocialMedia">Social Media</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="WordOfMouth">Word of Mouth</SelectItem>
                  <SelectItem value="PartnerReferral">Partner Referral</SelectItem>
                  <SelectItem value="Church">Church</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Input placeholder="Region" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input placeholder="Country" defaultValue="Philippines" />
            </div>
            <div className="pt-4">
              <Button
                className="w-full"
                onClick={() => {
                  toast.success("Supporter added successfully");
                  setSheetOpen(false);
                }}
              >
                Add Supporter
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
