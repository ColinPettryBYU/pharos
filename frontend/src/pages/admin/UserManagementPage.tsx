import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Shield } from "lucide-react";
import { toast } from "sonner";

const mockUsers = [
  { id: "1", email: "admin@pharos.org", displayName: "Admin User", roles: ["Admin"], mfa: false },
  { id: "2", email: "admin-mfa@pharos.org", displayName: "Admin (MFA)", roles: ["Admin"], mfa: true },
  { id: "3", email: "donor@pharos.org", displayName: "Donor User", roles: ["Donor"], mfa: false },
  { id: "4", email: "staff1@pharos.org", displayName: "SW Anna Cruz", roles: ["Staff"], mfa: false },
  { id: "5", email: "staff2@pharos.org", displayName: "SW Maria Reyes", roles: ["Staff"], mfa: false },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function UserManagementPage() {
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage user accounts and role assignments."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "User Management" },
        ]}
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        }
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        {mockUsers.map((user) => (
          <motion.div key={user.id} variants={item}>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.mfa && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Shield className="h-3 w-3" />
                      MFA
                    </Badge>
                  )}
                  {user.roles.map((role) => (
                    <Badge key={role} variant={role === "Admin" ? "default" : "secondary"} className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
                <Select defaultValue={user.roles[0]} onValueChange={() => toast.success("Role updated")}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Donor">Donor</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
