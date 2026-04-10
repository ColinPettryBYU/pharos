import { useState } from "react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useUsers, useInviteUser, useUpdateUserRole, useDeleteUser, useResetPassword } from "@/hooks/useUsers";
import { Plus, Shield, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/types";

const resetSchema = z.object({
  newPassword: z.string().min(14, "Minimum 14 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetForm = z.infer<typeof resetSchema>;

const inviteSchema = z.object({
  Email: z.string().email("Valid email required"),
  DisplayName: z.string().min(1, "Name is required"),
  Password: z.string().min(14, "Minimum 14 characters"),
  Role: z.string().min(1, "Role is required"),
  LinkedSupporterId: z.coerce.number().optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function UserManagementPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; email: string } | null>(null);

  const { data: users, isLoading, error, refetch } = useUsers();
  const inviteUser = useInviteUser();
  const updateRole = useUpdateUserRole();
  const deleteUserMut = useDeleteUser();
  const resetPassword = useResetPassword();

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema) as never,
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onResetSubmit = resetForm.handleSubmit(async (values) => {
    if (!resetTarget) return;
    try {
      await resetPassword.mutateAsync({ userId: resetTarget.id, newPassword: values.newPassword });
      toast.success(`Password reset for ${resetTarget.email}`);
      resetForm.reset();
      setResetOpen(false);
      setResetTarget(null);
    } catch {
      toast.error("Failed to reset password");
    }
  });

  const userList: any[] = Array.isArray(users) ? users : (users as any)?.data ?? [];

  const form = useForm<InviteForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(inviteSchema) as any,
    defaultValues: { Email: "", DisplayName: "", Password: "", Role: "", LinkedSupporterId: undefined },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await inviteUser.mutateAsync(values as unknown as Record<string, unknown>);
      toast.success("User created successfully");
      form.reset();
      setDialogOpen(false);
    } catch { /* handled by api client */ }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load users</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage user accounts and role assignments."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "User Management" }]}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Create User</Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : userList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">No users found</p>
          <p className="text-muted-foreground mb-4">Create the first user to get started</p>
          <Button onClick={() => setDialogOpen(true)}>Create User</Button>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {userList.map((user) => (
            <motion.div key={user.id} variants={item}>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {user.display_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{user.display_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.roles?.map((role: string) => (
                      <Badge key={role} variant={role === "Admin" ? "default" : "secondary"} className="text-xs">{role}</Badge>
                    ))}
                  </div>
                  <Select
                    defaultValue={user.roles?.[0] ?? "Donor"}
                    onValueChange={async (value) => {
                      try {
                        await updateRole.mutateAsync({ userId: user.id, roles: [value ?? "Donor"] });
                        toast.success("Role updated");
                      } catch { /* handled by api client */ }
                    }}
                  >
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Donor">Donor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Reset password"
                    onClick={() => { setResetTarget({ id: user.id, email: user.email }); resetForm.reset(); setResetOpen(true); }}
                  >
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setDeleteTarget(user); setDeleteOpen(true); }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Create a new user account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Display Name</Label><Input {...form.register("DisplayName")} placeholder="Full name" /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" {...form.register("Email")} placeholder="user@pharos.org" /></div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...form.register("Password")} placeholder="Minimum 14 characters" />
              {form.formState.errors.Password && <p className="text-xs text-destructive">{form.formState.errors.Password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.watch("Role") ?? ""} onValueChange={(v) => form.setValue("Role", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Donor">Donor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.watch("Role") === "Donor" && (
              <div className="space-y-2">
                <Label>Linked Supporter ID</Label>
                <Input type="number" {...form.register("LinkedSupporterId")} placeholder="Optional" />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={inviteUser.isPending}>
              {inviteUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={(open) => { setResetOpen(open); if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <span className="font-medium">{resetTarget?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onResetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...resetForm.register("newPassword")} placeholder="Minimum 14 characters" />
              {resetForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" {...resetForm.register("confirmPassword")} placeholder="Re-enter password" />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deleteTarget?.email || ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteUserMut.mutateAsync(deleteTarget.id);
            toast.success("User deleted");
            setDeleteOpen(false);
            setDeleteTarget(null);
          }
        }}
        loading={deleteUserMut.isPending}
      />
    </div>
  );
}
