import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { mockSafehouses } from "@/lib/mock-data";
import { MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SafehousesPage() {
  return (
    <div>
      <PageHeader
        title="Safehouses"
        description="Overview of all safehouse locations and their current status."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Safehouses" },
        ]}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {mockSafehouses.map((sh) => {
          const utilization = Math.round((sh.current_occupancy / sh.capacity_girls) * 100);
          const barColor = utilization > 90 ? "bg-destructive" : utilization > 70 ? "bg-warning" : "bg-success";

          return (
            <motion.div key={sh.safehouse_id} variants={item}>
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
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
                          <span className="font-medium tabular-nums">
                            {sh.current_occupancy} / {sh.capacity_girls}
                          </span>
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
                          <Users className="h-3.5 w-3.5" />
                          Staff: {sh.capacity_staff}
                        </span>
                        <Badge variant={sh.status === "Active" ? "default" : "secondary"} className="text-xs">
                          {sh.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
