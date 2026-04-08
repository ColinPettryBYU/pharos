import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { usePublicImpactSnapshots, usePublicSafehouses } from "@/hooks/usePublicData";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { Users, GraduationCap, HeartPulse, Building2, Calendar } from "lucide-react";
import { fmtDate } from "@/lib/utils";

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function ImpactDashboard() {
  const chartsRef = useRef(null);
  const chartsInView = useInView(chartsRef, { once: true, margin: "-50px" });

  const { data: snapshots, isLoading: snapshotsLoading } = usePublicImpactSnapshots();
  const { data: summary, isLoading: summaryLoading } = usePublicSafehouses();

  const snapshotList: any[] = Array.isArray(snapshots) ? snapshots : (snapshots as any)?.data ?? [];
  const latest = snapshotList[0];
  const isLoading = snapshotsLoading || summaryLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Impact Dashboard"
        description="Transparent, real-time data on how your support is making a difference."
      />

      {latest && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 shrink-0"><Calendar className="h-5 w-5 text-primary" /></div>
              <div>
                <Badge variant="secondary" className="mb-2">Latest Report</Badge>
                <h3 className="text-lg font-semibold">{latest.headline}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{latest.summary_text}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <motion.div variants={item}><StatCard title="Residents Served" value={summary?.totalResidents ?? 60} icon={Users} trend={{ value: 8, direction: "up" }} /></motion.div>
          <motion.div variants={item}><StatCard title="Avg Education Progress" value={summary?.avgEducationProgress ?? 78} format="percent" icon={GraduationCap} trend={{ value: 12, direction: "up" }} /></motion.div>
          <motion.div variants={item}><StatCard title="Avg Health Score" value={summary?.avgHealthScore ?? 4.2} icon={HeartPulse} trend={{ value: 5, direction: "up" }} /></motion.div>
          <motion.div variants={item}><StatCard title="Active Safehouses" value={summary?.totalSafehouses ?? 9} icon={Building2} /></motion.div>
        </motion.div>
      )}

      <div ref={chartsRef} className="mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={chartsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle className="text-lg">Regional Presence</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {["Luzon", "Visayas", "Mindanao"].map((region, i) => (
                  <div key={region} className="text-center p-6 rounded-xl bg-muted/50">
                    <h3 className="text-lg font-semibold">{region}</h3>
                    <p className="mt-1 text-3xl font-bold text-primary tabular-nums">{[3, 3, 3][i]}</p>
                    <p className="text-sm text-muted-foreground">Safehouses</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {snapshotList.length > 0 && (
        <motion.div variants={stagger} initial="hidden" animate="show">
          <h2 className="text-xl font-semibold mb-4">Monthly Impact Reports</h2>
          <div className="space-y-4">
            {snapshotList.map((snapshot) => (
              <motion.div key={snapshot.snapshot_id} variants={item}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="shrink-0 text-center">
                      <p className="text-2xl font-bold text-primary tabular-nums">{fmtDate(snapshot.snapshot_date, "dd")}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(snapshot.snapshot_date, "MMM yyyy")}</p>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{snapshot.headline}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{snapshot.summary_text}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
