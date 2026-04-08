import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupporters, useCreateSupporter, useUpdateSupporter, useDeleteSupporter } from "@/hooks/useSupporters";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Supporter, RiskLevel } from "@/types";
import { fmtDate } from "@/lib/utils";

const supporterSchema = z.object({
  FirstName: z.string().min(1, "First name is required"),
  LastName: z.string().min(1, "Last name is required"),
  DisplayName: z.string().min(1, "Display name is required"),
  Email: z.string().email("Valid email required").or(z.literal("")),
  Phone: z.string().optional(),
  SupporterType: z.string().min(1, "Type is required"),
  AcquisitionChannel: z.string().optional(),
  Region: z.string().optional(),
  Country: z.string().min(1, "Country is required"),
});

type SupporterForm = z.infer<typeof supporterSchema>;

export default function DonorsPage() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<Supporter | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Supporter | null>(null);

  const { data, isLoading, error, refetch } = useSupporters(
    typeFilter !== "all" ? { supporterType: typeFilter } : {}
  );
  const createSupporter = useCreateSupporter();
  const updateSupporter = useUpdateSupporter();
  const deleteSupporterMut = useDeleteSupporter();

  const supporters = Array.isArray(data) ? data : (data?.data ?? []);

  const form = useForm<SupporterForm>({
    resolver: zodResolver(supporterSchema),
    defaultValues: {
      FirstName: "", LastName: "", DisplayName: "", Email: "", Phone: "",
      SupporterType: "", AcquisitionChannel: "", Region: "", Country: "Philippines",
    },
  });

  useEffect(() => {
    if (editTarget) {
      form.reset({
        FirstName: editTarget.first_name || "",
        LastName: editTarget.last_name || "",
        DisplayName: editTarget.display_name || "",
        Email: editTarget.email || "",
        Phone: editTarget.phone || "",
        SupporterType: editTarget.supporter_type || "",
        AcquisitionChannel: editTarget.acquisition_channel || "",
        Region: editTarget.region || "",
        Country: editTarget.country || "Philippines",
      });
    }
  }, [editTarget, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editTarget) {
        await updateSupporter.mutateAsync({ id: editTarget.supporter_id, data: values as Record<string, unknown> });
        toast.success("Supporter updated successfully");
      } else {
        await createSupporter.mutateAsync(values as Record<string, unknown>);
        toast.success("Supporter added successfully");
      }
      form.reset();
      setSheetOpen(false);
      setEditTarget(null);
    } catch { /* handled by api client */ }
  });

  const columns: ColumnDef<Supporter>[] = useMemo(() => [
    {
      accessorKey: "display_name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.getValue("display_name")}</span>,
    },
    {
      accessorKey: "supporter_type",
      header: "Type",
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.getValue("supporter_type")}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={status === "Active" ? "default" : "secondary"} className="text-xs">{status}</Badge>;
      },
    },
    {
      accessorKey: "acquisition_channel",
      header: "Channel",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("acquisition_channel")}</span>,
    },
    {
      accessorKey: "first_donation_date",
      header: "First Donation",
      cell: ({ row }) => {
        const date = row.getValue("first_donation_date") as string;
        return <span className="text-sm text-muted-foreground tabular-nums">{fmtDate(date, "MMM d, yyyy", "N/A")}</span>;
      },
    },
    {
      accessorKey: "churn_risk",
      header: "Churn Risk",
      cell: ({ row }) => {
        const risk = row.getValue("churn_risk") as number;
        if (risk == null) return <span className="text-xs text-muted-foreground">-</span>;
        const level: RiskLevel = risk < 25 ? "Low" : risk < 50 ? "Medium" : risk < 75 ? "High" : "Critical";
        return <RiskBadge level={level} />;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const supporter = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditTarget(supporter); setSheetOpen(true); }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => { setDeleteTarget(supporter); setDeleteOpen(true); }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
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
        <p className="text-muted-foreground mb-4">Failed to load supporters</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const isPending = editTarget ? updateSupporter.isPending : createSupporter.isPending;

  return (
    <div>
      <PageHeader
        title="Supporters"
        description="Manage donors, volunteers, and partner organizations."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Supporters" }]}
        actions={
          <Button onClick={() => { setEditTarget(null); form.reset(); setSheetOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />Add Supporter
          </Button>
        }
      />

      {!isLoading && supporters.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No supporters yet</p>
          <p className="text-muted-foreground mb-4">Add your first supporter to get started</p>
          <Button onClick={() => setSheetOpen(true)}>Add Supporter</Button>
        </div>
      ) : (
        <DataTableWrapper
          columns={columns}
          data={supporters}
          searchKey="display_name"
          searchPlaceholder="Search supporters..."
          isLoading={isLoading}
          onRowClick={(row) => navigate(`/admin/donors/${row.supporter_id}`)}
          filterComponent={
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
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
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { setEditTarget(null); form.reset(); } }}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Supporter" : "Add New Supporter"}</SheetTitle>
            <SheetDescription>{editTarget ? "Update supporter information." : "Add a new donor, volunteer, or partner."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input {...form.register("FirstName")} placeholder="First name" />
                {form.formState.errors.FirstName && <p className="text-xs text-destructive">{form.formState.errors.FirstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input {...form.register("LastName")} placeholder="Last name" />
                {form.formState.errors.LastName && <p className="text-xs text-destructive">{form.formState.errors.LastName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Name <span className="text-destructive">*</span></Label>
              <Input {...form.register("DisplayName")} placeholder="Display name" />
              {form.formState.errors.DisplayName && <p className="text-xs text-destructive">{form.formState.errors.DisplayName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" {...form.register("Email")} placeholder="email@example.com" />
              {form.formState.errors.Email && <p className="text-xs text-destructive">{form.formState.errors.Email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Supporter Type <span className="text-destructive">*</span></Label>
              <Select value={form.watch("SupporterType") ?? ""} onValueChange={(v) => form.setValue("SupporterType", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MonetaryDonor">Monetary Donor</SelectItem>
                  <SelectItem value="InKindDonor">In-Kind Donor</SelectItem>
                  <SelectItem value="Volunteer">Volunteer</SelectItem>
                  <SelectItem value="SkillsContributor">Skills Contributor</SelectItem>
                  <SelectItem value="SocialMediaAdvocate">Social Media Advocate</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.SupporterType && <p className="text-xs text-destructive">{form.formState.errors.SupporterType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Acquisition Channel</Label>
              <Select value={form.watch("AcquisitionChannel") ?? ""} onValueChange={(v) => form.setValue("AcquisitionChannel", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
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
              <Label>Country <span className="text-destructive">*</span></Label>
              <Input {...form.register("Country")} placeholder="Country" />
            </div>
            <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are required.</p>
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving..." : editTarget ? "Update Supporter" : "Add Supporter"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget?.display_name || ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSupporterMut.mutateAsync(deleteTarget.supporter_id);
            toast.success("Supporter deleted");
            setDeleteOpen(false);
            setDeleteTarget(null);
          }
        }}
        loading={deleteSupporterMut.isPending}
      />
    </div>
  );
}
