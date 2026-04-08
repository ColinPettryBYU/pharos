import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSafehouses, useCreateSafehouse, useUpdateSafehouse, useDeleteSafehouse } from "@/hooks/useSafehouses";
import { MapPin, Users, Trash2, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Safehouse } from "@/types";

const safehouseSchema = z.object({
  Name: z.string().min(1, "Name is required"),
  SafehouseCode: z.string().min(1, "Code is required"),
  Region: z.string().min(1, "Region is required"),
  City: z.string().min(1, "City is required"),
  Province: z.string().min(1, "Province is required"),
  Country: z.string().default("Philippines"),
  Status: z.string().default("Active"),
  CapacityGirls: z.coerce.number().min(1, "Capacity is required"),
  CapacityStaff: z.coerce.number().min(1, "Staff capacity is required"),
});

type SafehouseForm = z.infer<typeof safehouseSchema>;

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SafehousesPage() {
  const { data: safehouses, isLoading, error, refetch } = useSafehouses();
  const createSafehouse = useCreateSafehouse();
  const updateSafehouse = useUpdateSafehouse();
  const deleteSafehouse = useDeleteSafehouse();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Safehouse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Safehouse | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = Array.isArray(safehouses) ? safehouses : (safehouses as any)?.data ?? [];

  const form = useForm<SafehouseForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(safehouseSchema) as any,
    defaultValues: {
      Name: "", SafehouseCode: "", Region: "", City: "", Province: "",
      Country: "Philippines", Status: "Active", CapacityGirls: 0, CapacityStaff: 0,
    },
  });

  useEffect(() => {
    if (editTarget) {
      form.reset({
        Name: editTarget.name || "",
        SafehouseCode: editTarget.safehouse_code || "",
        Region: editTarget.region || "",
        City: editTarget.city || "",
        Province: editTarget.province || "",
        Country: editTarget.country || "Philippines",
        Status: editTarget.status || "Active",
        CapacityGirls: editTarget.capacity_girls || 0,
        CapacityStaff: editTarget.capacity_staff || 0,
      });
    }
  }, [editTarget, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editTarget) {
        await updateSafehouse.mutateAsync({ id: editTarget.safehouse_id, data: values as unknown as Record<string, unknown> });
        toast.success("Safehouse updated successfully");
      } else {
        await createSafehouse.mutateAsync(values as unknown as Record<string, unknown>);
        toast.success("Safehouse added successfully");
      }
      form.reset();
      setSheetOpen(false);
      setEditTarget(null);
    } catch { /* handled by api client */ }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load safehouses</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const isPending = editTarget ? updateSafehouse.isPending : createSafehouse.isPending;

  return (
    <div>
      <PageHeader
        title="Safehouses"
        description="Overview of all safehouse locations and their current status."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Safehouses" }]}
        actions={
          <Button onClick={() => { setEditTarget(null); form.reset(); setSheetOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />Add Safehouse
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No safehouses found</p>
          <p className="text-muted-foreground mb-4">Add the first safehouse to get started.</p>
          <Button onClick={() => setSheetOpen(true)}>Add Safehouse</Button>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((sh) => {
            const utilization = Math.round((sh.current_occupancy / sh.capacity_girls) * 100);
            const barColor = utilization > 90 ? "bg-destructive" : utilization > 70 ? "bg-warning" : "bg-success";

            return (
              <motion.div key={sh.safehouse_id} variants={item}>
                <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{sh.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {sh.city}, {sh.province}
                          </div>
                        </div>
                        <Badge variant="outline">{sh.region}</Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Occupancy</span>
                            <span className="font-medium tabular-nums">{sh.current_occupancy} / {sh.capacity_girls}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${utilization}%` }}
                              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                              className={cn("h-full rounded-full", barColor)}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{utilization}% utilized</p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />Staff: {sh.capacity_staff}
                          </span>
                          <div className="flex items-center gap-1">
                            <Badge variant={sh.status === "Active" ? "default" : "secondary"} className="text-xs">{sh.status}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); setEditTarget(sh); setSheetOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(sh); setDeleteOpen(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { setEditTarget(null); form.reset(); } }}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Safehouse" : "Add Safehouse"}</SheetTitle>
            <SheetDescription>{editTarget ? "Update safehouse information." : "Register a new safehouse location."}</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input {...form.register("Name")} placeholder="Safehouse name" />
              {form.formState.errors.Name && <p className="text-xs text-destructive">{form.formState.errors.Name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Safehouse Code <span className="text-destructive">*</span></Label>
              <Input {...form.register("SafehouseCode")} placeholder="SH-NCR-01" />
              {form.formState.errors.SafehouseCode && <p className="text-xs text-destructive">{form.formState.errors.SafehouseCode.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Region <span className="text-destructive">*</span></Label>
                <Input {...form.register("Region")} placeholder="NCR" />
              </div>
              <div className="space-y-2">
                <Label>Province <span className="text-destructive">*</span></Label>
                <Input {...form.register("Province")} placeholder="Province" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>City <span className="text-destructive">*</span></Label>
              <Input {...form.register("City")} placeholder="City" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Girl Capacity <span className="text-destructive">*</span></Label>
                <Input type="number" {...form.register("CapacityGirls")} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Staff Capacity <span className="text-destructive">*</span></Label>
                <Input type="number" {...form.register("CapacityStaff")} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("Status") ?? "Active"} onValueChange={(v) => form.setValue("Status", v ?? "Active")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Under Construction">Under Construction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are required.</p>
            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving..." : editTarget ? "Update Safehouse" : "Add Safehouse"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget?.name || ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteSafehouse.mutateAsync(deleteTarget.safehouse_id);
            toast.success("Safehouse deleted");
            setDeleteOpen(false);
            setDeleteTarget(null);
          }
        }}
        loading={deleteSafehouse.isPending}
      />
    </div>
  );
}
