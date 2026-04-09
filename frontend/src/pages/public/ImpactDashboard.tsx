import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/shared/StatCard";
import { usePublicImpactSnapshots, usePublicSafehouses } from "@/hooks/usePublicData";
import {
  Users, GraduationCap, HeartPulse, Building2, Calendar, ArrowRight,
} from "lucide-react";
import { fmtDate } from "@/lib/utils";

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight">{children}</h2>
      <div className="mt-2 h-1 w-12 rounded-full bg-primary/60" />
    </div>
  );
}

export default function ImpactDashboard() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });
  const chartsRef = useRef(null);
  const chartsInView = useInView(chartsRef, { once: true, margin: "-50px" });

  const { data: snapshots, isLoading: snapshotsLoading } = usePublicImpactSnapshots();
  const { data: summary, isLoading: summaryLoading } = usePublicSafehouses();

  const snapshotList: any[] = Array.isArray(snapshots) ? snapshots : (snapshots as any)?.data ?? [];
  const latest = snapshotList[0];
  const isLoading = snapshotsLoading || summaryLoading;

  const impactStats = [
    { label: "Residents Served", value: summary?.total_residents ?? 0, icon: Users, suffix: "+", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Education Progress", value: summary?.avg_education_progress ?? 0, icon: GraduationCap, suffix: "%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Avg Health Score", value: summary?.avg_health_score ?? 0, icon: HeartPulse, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Active Safehouses", value: summary?.total_safehouses ?? 0, icon: Building2, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-60 w-60 rounded-full bg-accent/8 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Badge variant="secondary" className="mb-4 text-sm">Transparency Report</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              See the <span className="text-primary">Impact</span> of Your Support
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Real data, real outcomes. Every number represents a life changed, a future restored.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Latest Report Highlight */}
        {latest && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
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

        {/* Key Metrics */}
        <SectionHeading>Key Metrics</SectionHeading>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : (
          <div ref={statsRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {impactStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="text-4xl font-bold tracking-tight tabular-nums">
                        {statsInView ? <AnimatedNumber value={stat.value} /> : "0"}
                        {stat.suffix && <span className="text-primary">{stat.suffix}</span>}
                      </div>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Photo Placeholder + Regional Presence */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-xl bg-muted/50 aspect-video flex items-center justify-center border border-border/50">
              <span className="text-muted-foreground text-sm">Impact Photo</span>
            </div>
          </motion.div>

          <div ref={chartsRef}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={chartsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full">
                <CardHeader><CardTitle className="text-lg">Regional Presence</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {["Luzon", "Visayas", "Mindanao"].map((region) => (
                      <div key={region} className="text-center p-5 rounded-xl bg-muted/50">
                        <h3 className="text-sm font-semibold text-muted-foreground">{region}</h3>
                        <p className="mt-1 text-3xl font-bold text-primary tabular-nums">{summary?.region_breakdown?.[region] ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Safehouses</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Monthly Impact Reports */}
        {snapshotList.length > 0 && (
          <div className="mb-12">
            <SectionHeading>Monthly Impact Reports</SectionHeading>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              {snapshotList.map((snapshot) => (
                <motion.div key={snapshot.snapshot_id} variants={item}>
                  <Card className="transition-shadow">
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
            </motion.div>
          </div>
        )}

        {/* Image Placeholder Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {["Community Gathering", "Education Program", "Safehouse Life"].map((label) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-xl bg-muted/50 aspect-video flex flex-col items-center justify-center border border-border/50 gap-2">
                <span className="text-muted-foreground text-sm">{label}</span>
                <span className="text-muted-foreground/50 text-xs">Photo coming soon</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 sm:p-12 text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Inspired? Become a supporter today.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Your generosity directly funds the safety, education, and healing of girls
            who need it most.
          </p>
          <div className="mt-6">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
