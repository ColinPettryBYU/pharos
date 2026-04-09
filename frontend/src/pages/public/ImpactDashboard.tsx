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
  Users,
  GraduationCap,
  HeartPulse,
  Building2,
  Calendar,
  ArrowRight,
  MapPin,
  Globe,
  HandHeart,
  Sparkles,
  Activity,
} from "lucide-react";
import { fmtDate } from "@/lib/utils";

function scrubName(text: string): string {
  return text
    .replace(/Lighthouse Sanctuary/gi, "Pharos")
    .replace(/Lighthouse/gi, "Pharos");
}

function SectionHeading({ children, sub, center }: { children: React.ReactNode; sub?: string; center?: boolean }) {
  return (
    <div className={`mb-10 ${center ? "text-center" : ""}`}>
      {sub && (
        <span className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block" style={{ color: "var(--pharos-sage)" }}>
          {sub}
        </span>
      )}
      <h2
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
      >
        {children}
      </h2>
      <div className={`mt-3 h-1 w-14 rounded-full ${center ? "mx-auto" : ""}`} style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush))" }} />
    </div>
  );
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SnapshotSection({ snapshots }: { snapshots: Array<{ snapshot_id: number; snapshot_date: string; headline: string; summary_text: string; metric_payload_json: string; is_published: boolean }> }) {
  const accents = ["var(--pharos-sky)", "var(--pharos-blush)", "var(--pharos-sage)"];

  return (
    <AnimatedSection className="mb-14">
      <SectionHeading sub="Updates">Impact Updates</SectionHeading>
      <div className="space-y-4">
        {snapshots.slice(0, 5).map((snapshot, i) => {
          let metrics: Array<{ label: string; value: string }> = [];
          try {
            const raw = JSON.parse(snapshot.metric_payload_json || "{}");
            metrics = Object.entries(raw).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v) }));
          } catch { /* empty */ }

          return (
            <motion.div
              key={snapshot.snapshot_id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card
                className="overflow-hidden border-border/60 hover:shadow-md transition-all duration-300"
                style={{ borderLeft: `3px solid ${accents[i % 3]}` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 text-center rounded-xl p-3 min-w-[64px] bg-muted/40">
                      <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: "var(--pharos-forest)", fontFamily: "var(--font-editorial)" }}>
                        {fmtDate(snapshot.snapshot_date, "dd")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{fmtDate(snapshot.snapshot_date, "MMM yy")}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold" style={{ color: "var(--pharos-forest)" }}>{scrubName(snapshot.headline)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{scrubName(snapshot.summary_text)}</p>
                      {metrics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {metrics.map((m) => (
                            <span key={m.label} className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs">
                              <span className="font-semibold" style={{ color: accents[i % 3] }}>{m.value}</span>
                              <span className="text-muted-foreground">{m.label}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      {snapshots.length > 5 && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-center text-sm text-muted-foreground"
        >
          and {snapshots.length - 5} more reports available
        </motion.p>
      )}
    </AnimatedSection>
  );
}

export default function ImpactDashboard() {
  const regionsRef = useRef(null);
  const regionsInView = useInView(regionsRef, { once: true, margin: "-50px" });

  const { data: snapshots, isLoading: snapshotsLoading } = usePublicImpactSnapshots();
  const { data: summary, isLoading: summaryLoading } = usePublicSafehouses();

  const snapshotList: Array<{
    snapshot_id: number;
    snapshot_date: string;
    headline: string;
    summary_text: string;
    metric_payload_json: string;
    is_published: boolean;
  }> = Array.isArray(snapshots) ? snapshots : ((snapshots as unknown as Record<string, unknown>)?.data as typeof snapshotList) ?? [];

  const latest = snapshotList[0];
  const isLoading = snapshotsLoading || summaryLoading;

  const impactStats = [
    { label: "Residents Served", value: summary?.total_residents ?? 0, icon: Users, suffix: "+", accent: "var(--pharos-sky)", description: "Girls receiving care across all safehouses", fmt: "number" as const },
    { label: "Education Progress", value: summary?.avg_education_progress ?? 0, icon: GraduationCap, suffix: "%", accent: "var(--pharos-sage)", description: "Average academic achievement rate", fmt: "decimal" as const, dp: 1 },
    { label: "Avg Health Score", value: summary?.avg_health_score ?? 0, icon: HeartPulse, accent: "var(--pharos-blush)", description: "Physical & mental well-being (out of 5)", fmt: "decimal" as const, dp: 2, suffix: "/5" },
    { label: "Active Safehouses", value: summary?.total_safehouses ?? 0, icon: Building2, accent: "#f0c96e", description: "Safe homes operating in the Philippines", fmt: "number" as const },
    { label: "Donations Received", value: summary?.total_donations ?? 0, icon: HandHeart, suffix: "", accent: "var(--pharos-sky)", description: "Total contributions from generous supporters", fmt: "currency" as const },
    { label: "Regions Covered", value: summary?.regions_count ?? 0, icon: Globe, accent: "var(--pharos-sage)", description: "Expanding reach across the Philippines", fmt: "number" as const },
  ];

  const regions = [
    { name: "Luzon", accent: "var(--pharos-sky)" },
    { name: "Visayas", accent: "var(--pharos-blush)" },
    { name: "Mindanao", accent: "var(--pharos-sage)" },
  ];

  const programHighlights = [
    { icon: GraduationCap, title: "Education & Skills", description: "Vocational training, tutoring, and school enrollment to prepare each girl for independence.", accent: "var(--pharos-sage)" },
    { icon: HeartPulse, title: "Health & Wellness", description: "Regular medical check-ups, nutrition programs, and mental health counseling for holistic recovery.", accent: "var(--pharos-blush)" },
    { icon: Activity, title: "Counseling & Therapy", description: "Trauma-informed individual and group sessions helping girls process their experiences and heal.", accent: "var(--pharos-sky)" },
    { icon: Sparkles, title: "Reintegration", description: "Careful family reunification or placement with ongoing monitoring and community support.", accent: "#f0c96e" },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28 sm:py-40">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 55%, #3a2d3a 100%)" }} />

        {/* Soft radial gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(245,184,184,0.18) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 15% 75%, rgba(176,196,216,0.15) 0%, transparent 45%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(90,112,85,0.06) 0%, transparent 60%)" }} />

        {/* Animated geometric shapes */}
        <motion.div
          className="pointer-events-none absolute top-[18%] right-[10%] h-24 w-24 rounded-full border-2"
          style={{ borderColor: "rgba(245,184,184,0.15)" }}
          animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute top-[42%] right-[22%] h-12 w-12 rounded-xl"
          style={{ background: "rgba(176,196,216,0.08)" }}
          animate={{ y: [0, -14, 0], rotate: [12, 24, 12] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-[22%] left-[8%] h-16 w-16 rounded-full border"
          style={{ borderColor: "rgba(176,196,216,0.12)" }}
          animate={{ y: [0, -12, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute top-[65%] right-[6%] h-8 w-8 rounded-lg border"
          style={{ borderColor: "rgba(245,184,184,0.12)" }}
          animate={{ y: [0, -10, 0], rotate: [45, 55, 45] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute top-[12%] left-[15%] h-6 w-6 rounded-md"
          style={{ background: "rgba(245,184,184,0.10)" }}
          animate={{ y: [0, -8, 0], rotate: [0, 20, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Decorative rings */}
        <div className="absolute right-[8%] top-1/2 -translate-y-1/2 h-80 w-80 rounded-full border-2 pointer-events-none" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
        <div className="absolute right-[8%] top-1/2 -translate-y-1/2 h-56 w-56 rounded-full border pointer-events-none" style={{ borderColor: "rgba(255,255,255,0.04)" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="flex items-center justify-center mb-6">
              <img src="/images/pharos-logo-white.png" alt="Pharos" className="h-12 w-12 object-contain drop-shadow-xl" />
            </div>
            <h1
              className="leading-[1.08] text-white drop-shadow"
              style={{ fontFamily: "var(--font-editorial)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 600 }}
            >
              See the Impact of{" "}
              <em className="not-italic" style={{ color: "var(--pharos-blush)" }}>Your Support</em>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/65 leading-relaxed">
              Real data, real outcomes. Every number represents a life changed, a future restored.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 leading-[0]">
          <svg viewBox="0 0 1440 80" fill="none" className="block w-full" preserveAspectRatio="none">
            <path d="M0,40 C360,80 720,10 1080,40 C1260,55 1380,25 1440,40 L1440,80 L0,80 Z" className="fill-background" />
          </svg>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ─── KEY METRICS ────────────────────────────────────────────────── */}
        <SectionHeading sub="By the Numbers" center>Key Metrics</SectionHeading>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-14">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-14">
            {impactStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <Card className="h-full overflow-hidden border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${stat.accent}, transparent)` }} />
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                          style={{ background: `color-mix(in srgb, ${stat.accent} 16%, transparent)` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: stat.accent }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                              <AnimatedNumber value={stat.value} format={stat.fmt} decimals={"dp" in stat ? (stat as { dp: number }).dp : undefined} />
                            </span>
                            {stat.suffix && (
                              <span className="text-xl font-semibold" style={{ color: stat.accent }}>{stat.suffix}</span>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground/70 leading-relaxed">{stat.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ─── LATEST REPORT ──────────────────────────────────────────────── */}
        {latest && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mb-14">
            <Card className="overflow-hidden border-border/60 shadow-md" style={{ borderLeft: "4px solid var(--pharos-sky)" }}>
              <CardContent className="p-6 sm:p-8 flex items-start gap-5">
                <div className="rounded-xl p-3 shrink-0" style={{ background: "color-mix(in srgb, var(--pharos-sky) 18%, transparent)" }}>
                  <Calendar className="h-5 w-5" style={{ color: "var(--pharos-sky)" }} />
                </div>
                <div>
                  <Badge className="mb-2 text-xs font-bold" style={{ background: "color-mix(in srgb, var(--pharos-sky) 12%, transparent)", color: "var(--pharos-forest)" }}>
                    Latest Update — {fmtDate(latest.snapshot_date, "MMMM yyyy")}
                  </Badge>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--pharos-forest)" }}>{scrubName(latest.headline)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">{scrubName(latest.summary_text)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── REGIONAL PRESENCE ──────────────────────────────────────────── */}
        <AnimatedSection className="relative mb-14 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(176,196,216,0.08) 0%, transparent 50%)" }} />

          <motion.div
            className="pointer-events-none absolute top-[10%] right-[5%] h-16 w-16 rounded-full border"
            style={{ borderColor: "rgba(245,184,184,0.12)" }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[15%] left-[3%] h-10 w-10 rounded-xl"
            style={{ background: "rgba(176,196,216,0.06)" }}
            animate={{ y: [0, -8, 0], rotate: [8, 18, 8] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Map context */}
            <div className="lg:col-span-2 flex flex-col justify-center">
              <SectionHeading sub="Across the Philippines">Regional Presence</SectionHeading>
              <p className="text-muted-foreground leading-relaxed -mt-4 mb-6">
                Our safehouses span the three major island groups, bringing care and protection to girls in communities that need it most.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--pharos-sage) 15%, transparent)" }}>
                  <MapPin className="h-5 w-5" style={{ color: "var(--pharos-sage)" }} />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--pharos-forest)", fontFamily: "var(--font-editorial)" }}>
                    {summary?.regions_count ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Active regions</p>
                </div>
              </div>
            </div>

            {/* Region cards */}
            <div ref={regionsRef} className="lg:col-span-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {regions.map((region, i) => {
                const count = summary?.region_breakdown?.[region.name];
                return (
                  <motion.div
                    key={region.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={regionsInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.1 + i * 0.1, type: "spring", stiffness: 180, damping: 20 }}
                  >
                    <Card className="h-full border-border/60 overflow-hidden group hover:shadow-md transition-all duration-300">
                      <div className="h-1 w-full" style={{ background: region.accent }} />
                      <CardContent className="p-6 text-center">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${region.accent} 18%, transparent)` }}>
                          <MapPin className="h-5 w-5" style={{ color: region.accent }} />
                        </div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{region.name}</h3>
                        <p
                          className="text-4xl font-bold tabular-nums mb-1"
                          style={{ color: "var(--pharos-forest)", fontFamily: "var(--font-editorial)" }}
                        >
                          {count ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">Safehouses</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* ─── PROGRAM HIGHLIGHTS ─────────────────────────────────────────── */}
        <AnimatedSection className="relative mb-14 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 60%, rgba(245,184,184,0.08) 0%, transparent 45%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 85% 20%, rgba(176,196,216,0.06) 0%, transparent 40%)" }} />

          <motion.div
            className="pointer-events-none absolute top-[8%] left-[5%] h-20 w-20 rounded-full border-2"
            style={{ borderColor: "rgba(176,196,216,0.10)" }}
            animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[10%] right-[7%] h-8 w-8 rounded-lg"
            style={{ background: "rgba(245,184,184,0.08)" }}
            animate={{ y: [0, -10, 0], rotate: [0, 25, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative">
            <SectionHeading sub="What We Do" center>Our Programs</SectionHeading>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {programHighlights.map((program, i) => {
                const Icon = program.icon;
                return (
                  <motion.div
                    key={program.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <Card className="h-full border-border/60 overflow-hidden group hover:shadow-lg transition-all duration-300" style={{ borderTop: `3px solid ${program.accent}` }}>
                      <CardContent className="p-6 text-center">
                        <div
                          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                          style={{ background: `color-mix(in srgb, ${program.accent} 15%, transparent)` }}
                        >
                          <Icon className="h-7 w-7" style={{ color: program.accent }} />
                        </div>
                        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--pharos-forest)" }}>{program.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>


        {/* ─── MONTHLY REPORTS ────────────────────────────────────────────── */}
        {snapshotList.length > 0 && (
          <SnapshotSection snapshots={snapshotList} />
        )}

        {/* ─── CTA ────────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3a2d3a 100%)" }}
        >
          {/* Soft radial gradients */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(176,196,216,0.12) 0%, transparent 50%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 80%, rgba(245,184,184,0.10) 0%, transparent 50%)" }} />

          {/* Animated shapes */}
          <motion.div
            className="pointer-events-none absolute top-[15%] left-[10%] h-14 w-14 rounded-full border border-white/10"
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[20%] right-[12%] h-10 w-10 rounded-xl"
            style={{ background: "rgba(245,184,184,0.06)" }}
            animate={{ y: [0, -12, 0], rotate: [10, 22, 10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute top-[50%] right-[30%] h-20 w-20 rounded-full border border-white/5"
            animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative p-10 sm:p-14 text-center">
            <motion.img
              src="/images/pharos-logo-white.png"
              alt="Pharos"
              className="mx-auto h-14 w-14 object-contain mb-6 drop-shadow-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white" style={{ fontFamily: "var(--font-editorial)" }}>
              Inspired? Make a difference today.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/60 leading-relaxed">
              Your generosity directly funds the safety, education, and healing of girls who need it most.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/donate">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-xl font-semibold" style={{ background: "var(--pharos-blush)", color: "#2d4a2a" }}>
                  Donate Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto backdrop-blur" style={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff", background: "rgba(255,255,255,0.08)" }}>
                  Become a Supporter
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
