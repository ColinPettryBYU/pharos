import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/shared/StatCard";
import { usePublicImpactSnapshots, usePublicSafehouses } from "@/hooks/usePublicData";
import { Users, GraduationCap, HeartPulse, Building2, Calendar, ArrowRight, MapPin, TrendingUp } from "lucide-react";
import { fmtDate } from "@/lib/utils";

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

/** Soft conic-gradient light beam */
function LightBeam({ className = "", from = "0% 50%" }: { className?: string; from?: string }) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        background: `conic-gradient(from 155deg at ${from}, transparent 0deg, rgba(245,184,184,0.12) 10deg, transparent 22deg, rgba(176,196,216,0.09) 34deg, transparent 48deg, rgba(245,184,184,0.07) 62deg, transparent 80deg, rgba(176,196,216,0.05) 100deg, transparent 120deg)`,
      }}
    />
  );
}

function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      {sub && <span className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block" style={{ color: "var(--pharos-sage)" }}>{sub}</span>}
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>{children}</h2>
      <div className="mt-2 h-1 w-12 rounded-full" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush))" }} />
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
    { label: "Residents Served", value: summary?.total_residents ?? 0, icon: Users, suffix: "+", accent: "var(--pharos-sky)" },
    { label: "Education Progress", value: summary?.avg_education_progress ?? 0, icon: GraduationCap, suffix: "%", accent: "var(--pharos-sage)" },
    { label: "Avg Health Score", value: summary?.avg_health_score ?? 0, icon: HeartPulse, accent: "var(--pharos-blush)" },
    { label: "Active Safehouses", value: summary?.total_safehouses ?? 0, icon: Building2, accent: "#f0c96e" },
  ];

  const regions = [
    { name: "Luzon", emoji: "🌿", tint: "rgba(176,196,216,0.12)" },
    { name: "Visayas", emoji: "🌊", tint: "rgba(245,184,184,0.10)" },
    { name: "Mindanao", emoji: "🏝️", tint: "rgba(176,196,216,0.08)" },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-36">
        {/* Dark gradient — warm charcoal, NOT heavy green */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 55%, #3a2d3a 100%)" }} />
        {/* Blush/sky ambient blobs */}
        <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(245,184,184,0.20)" }} />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(176,196,216,0.16)" }} />

        {/* Light beams */}
        <LightBeam className="right-0 top-0 h-full w-1/2" from="100% 30%" />

        {/* Decorative rings */}
        <div className="absolute right-[8%] top-1/2 -translate-y-1/2 h-80 w-80 rounded-full border-2 pointer-events-none" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
        <div className="absolute right-[8%] top-1/2 -translate-y-1/2 h-56 w-56 rounded-full border pointer-events-none" style={{ borderColor: "rgba(255,255,255,0.05)" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src="/images/pharos-logo.png" alt="Pharos" className="h-12 w-12 object-contain drop-shadow-xl" />
              <Badge className="text-sm border-white/25 text-white/85" style={{ background: "rgba(255,255,255,0.12)" }}>Transparency Report</Badge>
            </div>
            <h1 className="leading-[1.1] text-white drop-shadow" style={{ fontFamily: "var(--font-editorial)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 600 }}>
              See the Impact of <em className="not-italic" style={{ color: "var(--pharos-blush)" }}>Your Support</em>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">Real data, real outcomes. Every number represents a life changed, a future restored.</p>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} className="mt-10 flex justify-center">
              <div className="flex flex-col items-center gap-1 text-white/40">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs tracking-widest uppercase">Our Numbers</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Latest Report */}
        {latest && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-14">
            <Card className="overflow-hidden border-border/60 shadow-md" style={{ borderLeft: "4px solid var(--pharos-sky)" }}>
              <CardContent className="p-6 flex items-start gap-5">
                <div className="rounded-xl p-3 shrink-0" style={{ background: "color-mix(in srgb, var(--pharos-sky) 20%, transparent)" }}>
                  <Calendar className="h-5 w-5" style={{ color: "var(--pharos-sky)" }} />
                </div>
                <div>
                  <Badge className="mb-2 text-xs font-bold" style={{ background: "color-mix(in srgb, var(--pharos-sky) 15%, transparent)", color: "var(--pharos-forest)" }}>Latest Report</Badge>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--pharos-forest)" }}>{latest.headline}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{latest.summary_text}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Key Metrics */}
        <SectionHeading sub="By the Numbers">Key Metrics</SectionHeading>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-14">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : (
          <div ref={statsRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-14">
            {impactStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }}>
                  <Card className="h-full overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow" style={{ borderLeft: `3px solid ${stat.accent}` }}>
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${stat.accent} 18%, transparent)` }}>
                        <Icon className="h-6 w-6" style={{ color: stat.accent }} />
                      </div>
                      <div className="text-4xl font-bold tracking-tight tabular-nums text-foreground">
                        {statsInView ? <AnimatedNumber value={stat.value} /> : "0"}
                        {stat.suffix && <span style={{ color: "var(--pharos-sage)" }}>{stat.suffix}</span>}
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Regional Presence + Photo */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-14">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}>
            <div className="rounded-2xl aspect-video flex flex-col items-center justify-center relative overflow-hidden border border-border/60 shadow-sm bg-muted/30">
              <div className="absolute h-40 w-40 rounded-full border-2 opacity-15" style={{ borderColor: "var(--pharos-sky)" }} />
              <div className="absolute h-28 w-28 rounded-full border opacity-10" style={{ borderColor: "var(--pharos-sky)" }} />
              <img src="/images/pharos-logo.png" alt="Pharos" className="relative h-14 w-14 object-contain opacity-35" />
              <span className="relative mt-3 text-sm font-medium text-muted-foreground/60">Impact Photo Coming Soon</span>
            </div>
          </motion.div>

          <div ref={chartsRef}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={chartsInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
              <Card className="h-full border-border/60 shadow-sm overflow-hidden">
                <div className="h-1" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush))" }} />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>
                    <MapPin className="h-4 w-4" style={{ color: "var(--pharos-sage)" }} />
                    Regional Presence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {regions.map((region, i) => (
                      <motion.div key={region.name} initial={{ opacity: 0, scale: 0.85 }} animate={chartsInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 200 }} className="text-center p-5 rounded-xl border border-border/60" style={{ background: region.tint }}>
                        <div className="text-2xl mb-1">{region.emoji}</div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{region.name}</h3>
                        <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--pharos-forest)", fontFamily: "var(--font-editorial)" }}>{summary?.region_breakdown?.[region.name] ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Safehouses</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Monthly Reports */}
        {snapshotList.length > 0 && (
          <div className="mb-14">
            <SectionHeading sub="Transparency">Monthly Impact Reports</SectionHeading>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {snapshotList.map((snapshot, i) => {
                const accents = ["var(--pharos-sky)", "var(--pharos-blush)", "var(--pharos-sage)"];
                return (
                  <motion.div key={snapshot.snapshot_id} variants={item}>
                    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow" style={{ borderLeft: `3px solid ${accents[i % 3]}` }}>
                      <CardContent className="p-5 flex items-center gap-5">
                        <div className="shrink-0 text-center rounded-xl p-3 min-w-[60px] bg-muted/40">
                          <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: "var(--pharos-forest)", fontFamily: "var(--font-editorial)" }}>{fmtDate(snapshot.snapshot_date, "dd")}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(snapshot.snapshot_date, "MMM yy")}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate" style={{ color: "var(--pharos-forest)" }}>{snapshot.headline}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{snapshot.summary_text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Photo grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-14">
          {[
            { label: "Community Gathering", tint: "rgba(176,196,216,0.10)", border: "var(--pharos-sky)" },
            { label: "Education Program", tint: "rgba(245,184,184,0.08)", border: "var(--pharos-blush)" },
            { label: "Safehouse Life", tint: "rgba(176,196,216,0.06)", border: "var(--pharos-sage)" },
          ].map((ph, i) => (
            <motion.div key={ph.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <div className="rounded-2xl aspect-video flex flex-col items-center justify-center border border-border/60 gap-2 relative overflow-hidden shadow-sm" style={{ background: ph.tint }}>
                <div className="absolute h-20 w-20 rounded-full border opacity-15" style={{ borderColor: ph.border }} />
                <span className="relative text-sm font-medium text-muted-foreground/70">{ph.label}</span>
                <span className="relative text-xs text-muted-foreground/40">Photo coming soon</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }} className="rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3a2d3a 100%)" }}>
          <LightBeam className="right-0 top-0 h-full w-1/2" from="100% 30%" />
          <div className="absolute -top-10 right-1/4 h-48 w-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(245,184,184,0.15)" }} />
          <div className="relative p-10 sm:p-14 text-center">
            <img src="/images/pharos-logo.png" alt="Pharos" className="mx-auto h-14 w-14 object-contain mb-5 drop-shadow-xl" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white" style={{ fontFamily: "var(--font-editorial)" }}>Inspired? Become a supporter today.</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/60">Your generosity directly funds the safety, education, and healing of girls who need it most.</p>
            <div className="mt-8">
              <Link to="/register">
                <Button size="lg" className="gap-2 shadow-xl font-semibold bg-white text-gray-900 hover:bg-gray-100">Get Started <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
