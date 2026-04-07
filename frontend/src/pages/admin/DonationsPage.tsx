import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDonations, useCreateDonation } from "@/hooks/useDonations";
import { formatCurrency } from "@/lib/api";
import type { Donation } from "@/types";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const donationSchema = z.object({
  SupporterId: z.coerce.number().min(1, "Supporter is required"),
  DonationType: z.string().min(1, "Type is required"),
  Amount: z.coerce.number().min(0, "Amount must be positive"),
  DonationDate: z.string().min(1, "Date is required"),
  IsRecurring: z.boolean().default(false),
  CampaignName: z.string().optional(),
  ChannelSource: z.string().optional(),
  CurrencyCode: z.string().default("PHP"),
  Notes: z.string().optional(),
});

type DonationForm = z.infer<typeof donationSchema>;

const columns: ColumnDef<Donation>[] = [
  {
    accessorKey: "donation_date",
    header: "Date",
    cell: ({ row }) => <span className="tabular-nums">{format(new Date(row.getValue("donation_date")), "MMM d, yyyy")}</span>,
  },
  {
    accessorKey: "supporter",
    header: "Donor",
    cell: ({ row }) => <span className="font-medium">{row.original.supporter?.display_name || "Unknown"}</span>,
  },
  {
    accessorKey: "donation_type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("donation_type")}</Badge>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.getValue("amount"))}</span>,
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
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, error, refetch } = useDonations(
    typeFilter !== "all" ? { donationType: typeFilter } : {}
  );
  const createDonation = useCreateDonation();
  const donations = Array.isArray(data) ? data : (data?.data ?? []);

  const form = useForm<DonationForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(donationSchema) as any,
    defaultValues: {
      SupporterId: 0, DonationType: "", Amount: 0, DonationDate: "",
      IsRecurring: false, CampaignName: "", ChannelSource: "", CurrencyCode: "PHP", Notes: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createDonation.mutateAsync(values as unknown as Record<string, unknown>);
      toast.success("Donation logged successfully");
      form.reset();
      setSheetOpen(false);
    } catch { /* handled by api client */ }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load donations</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Donations"
        description="Track and manage all donations across campaigns."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Donations" }]}
        actions={
          <Button onClick={() => setSheetOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Log Donation
          </Button>
        }
      />

      {!isLoading && donations.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No donations yet</p>
          <p className="text-muted-foreground mb-4">Log the first donation to get started</p>
          <Button onClick={() => setSheetOpen(true)}>Log Donation</Button>
        </div>
      ) : (
        <DataTableWrapper
          columns={columns}
          data={donations}
          searchKey="campaign_name"
          searchPlaceholder="Search by campaign..."
          isLoading={isLoading}
          filterComponent={
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
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
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Log Donation</SheetTitle>
            <SheetDescription>Record a new donation.</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Supporter ID <span className="text-destructive">*</span></Label>
              <Input type="number" {...form.register("SupporterId")} placeholder="Supporter ID" />
              {form.formState.errors.SupporterId && <p className="text-xs text-destructive">{form.formState.errors.SupporterId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Donation Type <span className="text-destructive">*</span></Label>
              <Select value={form.watch("DonationType") ?? ""} onValueChange={(v) => form.setValue("DonationType", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monetary">Monetary</SelectItem>
                  <SelectItem value="InKind">In-Kind</SelectItem>
                  <SelectItem value="Time">Time</SelectItem>
                  <SelectItem value="Skills">Skills</SelectItem>
                  <SelectItem value="SocialMedia">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (PHP) <span className="text-destructive">*</span></Label>
              <Input type="number" step="0.01" {...form.register("Amount")} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...form.register("DonationDate")} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.watch("IsRecurring")} onCheckedChange={(v) => form.setValue("IsRecurring", v)} />
              <Label>Recurring donation</Label>
            </div>
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={form.watch("CampaignName") ?? ""} onValueChange={(v) => form.setValue("CampaignName", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select campaign (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Year-End Hope">Year-End Hope</SelectItem>
                  <SelectItem value="Back to School">Back to School</SelectItem>
                  <SelectItem value="Summer of Safety">Summer of Safety</SelectItem>
                  <SelectItem value="GivingTuesday">GivingTuesday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channel Source</Label>
              <Select value={form.watch("ChannelSource") ?? ""} onValueChange={(v) => form.setValue("ChannelSource", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Campaign">Campaign</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="SocialMedia">Social Media</SelectItem>
                  <SelectItem value="PartnerReferral">Partner Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are required.</p>
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={createDonation.isPending}>
                {createDonation.isPending ? "Saving..." : "Log Donation"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
