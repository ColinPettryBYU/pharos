import { useState, useEffect, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { usePartners, useCreatePartner, useUpdatePartner, useDeletePartner } from "@/hooks/usePartners";
import type { Partner } from "@/types";
import { fmtDate } from "@/lib/utils";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const partnerSchema = z.object({
  PartnerName: z.string().min(1, "Organization name is required"),
  PartnerType: z.string().min(1, "Type is required"),
  RoleType: z.string().optional(),
  ContactName: z.string().min(1, "Contact name is required"),
  Email: z.string().email("Valid email required"),
  Phone: z.string().optional(),
  Region: z.string().optional(),
  Status: z.string().default("Active"),
  StartDate: z.string().min(1, "Start date is required"),
});

type PartnerForm = z.infer<typeof partnerSchema>;

export default function PartnersPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  const { data, isLoading, error, refetch } = usePartners();
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();
  const deletePartnerMut = useDeletePartner();

  const partners = Array.isArray(data) ? data : (data?.data ?? []);

  const form = useForm<PartnerForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(partnerSchema) as any,
    defaultValues: {
      PartnerName: "", PartnerType: "", RoleType: "",
      ContactName: "", Email: "", Phone: "",
      Region: "", Status: "Active", StartDate: "",
    },
  });

  useEffect(() => {
    if (editTarget) {
      form.reset({
        PartnerName: editTarget.partner_name || "",
        PartnerType: editTarget.partner_type || "",
        RoleType: editTarget.role_type || "",
        ContactName: editTarget.contact_name || "",
        Email: editTarget.email || "",
        Phone: editTarget.phone || "",
        Region: editTarget.region || "",
        Status: editTarget.status || "Active",
        StartDate: editTarget.start_date ? editTarget.start_date.split("T")[0] : "",
      });
    }
  }, [editTarget, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editTarget) {
        await updatePartner.mutateAsync({ id: editTarget.partner_id, data: values as unknown as Record<string, unknown> });
        toast.success("Partner updated successfully");
      } else {
        await createPartner.mutateAsync(values as unknown as Record<string, unknown>);
        toast.success("Partner added successfully");
      }
      form.reset();
      setSheetOpen(false);
      setEditTarget(null);
    } catch { /* handled by api client */ }
  });

  const columns: ColumnDef<Partner>[] = useMemo(() => [
    { accessorKey: "partner_name", header: "Organization", cell: ({ row }) => <span className="font-medium">{row.getValue("partner_name")}</span> },
    { accessorKey: "partner_type", header: "Type", cell: ({ row }) => <Badge variant="outline">{row.getValue("partner_type")}</Badge> },
    { accessorKey: "contact_name", header: "Contact" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("email")}</span> },
    { accessorKey: "region", header: "Region" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={row.getValue("status") === "Active" ? "default" : "secondary"} className="text-xs">{row.getValue("status")}</Badge>,
    },
    {
      accessorKey: "start_date",
      header: "Since",
      cell: ({ row }) => <span className="text-sm text-muted-foreground tabular-nums">{fmtDate(row.getValue("start_date"), "MMM yyyy")}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const partner = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditTarget(partner); setSheetOpen(true); }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => { setDeleteTarget(partner); setDeleteOpen(true); }}
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
        <p className="text-muted-foreground mb-4">Failed to load partners</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const isPending = editTarget ? updatePartner.isPending : createPartner.isPending;

  return (
    <div>
      <PageHeader
        title="Partners"
        description="Manage partner organizations and assignments."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Partners" }]}
        actions={
          <Button onClick={() => { setEditTarget(null); form.reset(); setSheetOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Partner</Button>
        }
      />

      {!isLoading && partners.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No partners yet</p>
          <p className="text-muted-foreground mb-4">Add the first partner to get started</p>
          <Button onClick={() => setSheetOpen(true)}>Add Partner</Button>
        </div>
      ) : (
        <DataTableWrapper columns={columns} data={partners} searchKey="partner_name" searchPlaceholder="Search partners..." isLoading={isLoading} />
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { setEditTarget(null); form.reset(); } }}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Partner" : "Add Partner"}</SheetTitle>
            <SheetDescription>{editTarget ? "Update partner information." : "Register a new partner organization."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2"><Label>Organization Name</Label><Input {...form.register("PartnerName")} placeholder="Organization name" /></div>
            <div className="space-y-2">
              <Label>Partner Type</Label>
              <Select value={form.watch("PartnerType") ?? ""} onValueChange={(v) => form.setValue("PartnerType", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="NGO">NGO</SelectItem>
                  <SelectItem value="Faith-Based">Faith-Based</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Contact Name</Label><Input {...form.register("ContactName")} placeholder="Contact person" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register("Email")} placeholder="partner@example.org" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input {...form.register("Phone")} placeholder="+63 912 345 6789" /></div>
            <div className="space-y-2"><Label>Region</Label><Input {...form.register("Region")} placeholder="Region" /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("Status") ?? "Active"} onValueChange={(v) => form.setValue("Status", v ?? "Active")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" {...form.register("StartDate")} /></div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : editTarget ? "Update Partner" : "Add Partner"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget?.partner_name || ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePartnerMut.mutateAsync(deleteTarget.partner_id);
            toast.success("Partner deleted");
            setDeleteOpen(false);
            setDeleteTarget(null);
          }
        }}
        loading={deletePartnerMut.isPending}
      />
    </div>
  );
}
