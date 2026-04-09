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
  Users, GraduationCap, HeartPulse, Building2, Calendar, ArrowRight, MapPin, TrendingUp,
} from "lucide-react";
import { fmtDate } from "@/lib/utils";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

/** Beacon rays SVG — emanating from a point */
function BeaconRays({ className = "", rays = 7 }: { className?: string; rays?: number }) {
  const angles = Array.from({ length: rays }, (_, i) => -30 + i * (60 / (rays - 1)));
  return (
    <svg
      viewBox="0 0 200 200"
      className={`absolute pointer-events-none ${className}`}
      fill="none"
    >
      {angles.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x2 = 0 + 350 * Math.cos(rad);
        const y2 = 100 - 350 * Math.sin(rad);
        return (
          <line
            key={i}
            x1="0"
            y1="100"
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={i === Math.floor(rays / 2) ? "3" : "1.5"}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      {sub && (
        <span
          className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block"
          style={{ color: "var(--pharos-sage)" }}
        >
          {sub}
        </span>
      )}
      <h2
        className="text-2xl font-bold tracking-tight sm:text-3xl"
        style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
      >
        {children}
      </h2>
      <div
        className="mt-2 h-1 w-12 rounded-full"
        style={{
          background: "linear-gradient(to right, var(--pharos-sage), var(--pharos-blush))",
        }}
      />
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
    {
      label: "Residents Served",
      value: summary?.total_residents ?? 0,
      icon: Users,
      suffix: "+",
      accent: "var(--pharos-sky)",
      accentText: "#1e3a5f",
    },
    {
      label: "Education Progress",
      value: summary?.avg_education_progress ?? 0,
      icon: GraduationCap,
      suffix: "%",
      accent: "var(--pharos-sage)",
      accentText: "var(--pharos-cream)",
    },
    {
      label: "Avg Health Score",
      value: summary?.avg_health_score ?? 0,
      icon: HeartPulse,
      accent: "var(--pharos-blush)",
      accentText: "#6b2a2a",
    },
    {
      label: "Active Safehouses",
      value: summary?.total_safehouses ?? 0,
      icon: Building2,
      accent: "#fde68a",
      accentText: "#713f12",
    },
  ];

  const regions = [
    { name: "Luzon", icon: "🌿" },
    { name: "Visayas", icon: "🌊" },
    { name: "Mindanao", icon: "🏝️" },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-36">
        {/* Rich gradient — sky blue → sage green */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--pharos-forest) 0%, var(--pharos-sage) 55%, rgba(176,196,216,0.7) 100%)",
          }}
        />
        {/* Blush blob top-right */}
        <div
          className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "rgba(245,184,184,0.25)" }}
        />
        {/* Sky blue blob bottom-left */}
        <div
          className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(176,196,216,0.22)" }}
        />

        {/* Beacon rays */}
        <BeaconRays
          className="right-0 top-0 h-full w-1/2 text-white opacity-[0.08]"
          rays={9}
        />

        {/* Decorative circle rings */}
        <div
          className="absolute right-[8%] top-1/2 -translate-y-1/2 h-96 w-96 rounded-full border-2 pointer-events-none"
          style={{ borderColor: "rgba(255,255,255,0.10)" }}
        />
        <div
          className="absolute right-[8%] top-1/2 -translate-y-1/2 h-64 w-64 rounded-full border pointer-events-none"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        />

        {/* Floating shapes */}
        <div
          className="pointer-events-none absolute top-[18%] left-[5%] h-14 w-14 rounded-full border border-white/20"
          style={{ animation: "float-slow-global 9s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute bottom-[22%] right-[6%] h-10 w-10 rounded-xl rotate-12"
          style={{
            background: "rgba(245,184,184,0.18)",
            animation: "float-medium-global 7s ease-in-out infinite",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Logo + eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <img
                src="/images/pharos-logo.png"
                alt="Pharos"
                className="h-12 w-12 object-contain drop-shadow-xl"
              />
              <Badge
                className="text-sm border-white/30 text-white/90"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                Transparency Report
              </Badge>
            </div>

            <h1
              className="leading-[1.1] text-white drop-shadow"
              style={{
                fontFamily: "var(--font-editorial)",
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                fontWeight: 600,
              }}
            >
              See the Impact of{" "}
              <em style={{ color: "var(--pharos-blush)" }}>Your Support</em>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/75 leading-relaxed">
              Real data, real outcomes. Every number represents a life changed,
              a future restored.
            </p>

            {/* Scroll cue */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-10 flex justify-center"
            >
              <div className="flex flex-col items-center gap-1 text-white/50">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs tracking-widest uppercase">Our Numbers</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Fade to bg */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Latest Report Highlight */}
        {latest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-14"
          >
            <Card
              className="overflow-hidden border-0 shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, rgba(90,112,85,0.12) 0%, rgba(245,184,184,0.10) 100%)",
                borderLeft: "4px solid var(--pharos-sage)",
              }}
            >
              <CardContent className="p-6 flex items-start gap-5">
                <div
                  className="rounded-xl p-3 shrink-0 shadow-sm"
                  style={{ background: "var(--pharos-sage)" }}
                >
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Badge
                    className="mb-2 text-xs font-bold"
                    style={{
                      background: "rgba(90,112,85,0.15)",
                      color: "var(--pharos-forest)",
                    }}
                  >
                    Latest Report
                  </Badge>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "var(--pharos-forest)" }}
                  >
                    {latest.headline}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {latest.summary_text}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Key Metrics */}
        <SectionHeading sub="By the Numbers">Key Metrics</SectionHeading>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-14">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div
            ref={statsRef}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-14"
          >
            {impactStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="h-full overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {/* Colored top stripe */}
                      <div className="h-1.5" style={{ background: stat.accent }} />
                      <div className="p-6 text-center">
                        <div
                          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{ background: stat.accent + "33" }}
                        >
                          <Icon
                            className="h-6 w-6"
                            style={{ color: stat.accent === "#fde68a" ? "#a16207" : stat.accent }}
                          />
                        </div>
                        <div
                          className="text-4xl font-bold tracking-tight tabular-nums"
                          style={{ color: "var(--pharos-forest)" }}
                        >
                          {statsInView ? (
                            <AnimatedNumber value={stat.value} />
                          ) : (
                            "0"
                          )}
                          {stat.suffix && (
                            <span style={{ color: "var(--pharos-sage)" }}>
                              {stat.suffix}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Regional Presence + Reach map placeholder */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-14">
          {/* Impact visual placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="rounded-2xl aspect-video flex flex-col items-center justify-center relative overflow-hidden border border-border/60 shadow-sm"
              style={{ background: "linear-gradient(135deg, rgba(90,112,85,0.10) 0%, rgba(176,196,216,0.12) 100%)" }}
            >
              {/* Decorative rings */}
              <div
                className="absolute h-48 w-48 rounded-full border-2 opacity-20"
                style={{ borderColor: "var(--pharos-sage)" }}
              />
              <div
                className="absolute h-32 w-32 rounded-full border opacity-15"
                style={{ borderColor: "var(--pharos-sage)" }}
              />
              <img
                src="/images/pharos-logo.png"
                alt="Pharos"
                className="relative h-16 w-16 object-contain opacity-40"
              />
              <span className="relative mt-3 text-sm font-medium text-muted-foreground/70">
                Impact Photo Coming Soon
              </span>
            </div>
          </motion.div>

          {/* Regional presence */}
          <div ref={chartsRef}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={chartsInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-border/60 shadow-sm overflow-hidden">
                <div className="h-1" style={{ background: "linear-gradient(to right, var(--pharos-sage), var(--pharos-blush))" }} />
                <CardHeader>
                  <CardTitle
                    className="text-lg flex items-center gap-2"
                    style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: "var(--pharos-sage)" }} />
                    Regional Presence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {regions.map((region, i) => (
                      <motion.div
                        key={region.name}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={chartsInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 200 }}
                        className="text-center p-5 rounded-xl border border-border/60"
                        style={{ background: i === 0 ? "rgba(90,112,85,0.08)" : i === 1 ? "rgba(176,196,216,0.12)" : "rgba(245,184,184,0.10)" }}
                      >
                        <div className="text-2xl mb-1">{region.icon}</div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{region.name}</h3>
                        <p
                          className="text-3xl font-bold tabular-nums"
                          style={{ color: "var(--pharos-forest)", fontFamily: "var(--font-editorial)" }}
                        >
                          {summary?.region_breakdown?.[region.name] ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">Safehouses</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Monthly Impact Reports */}
        {snapshotList.length > 0 && (
          <div className="mb-14">
            <SectionHeading sub="Transparency">Monthly Impact Reports</SectionHeading>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {snapshotList.map((snapshot, i) => (
                <motion.div key={snapshot.snapshot_id} variants={item}>
                  <Card
                    className="overflow-hidden border-border/60 hover:shadow-md transition-shadow"
                    style={{ borderLeft: `3px solid ${i % 3 === 0 ? "var(--pharos-sage)" : i % 3 === 1 ? "var(--pharos-blush)" : "var(--pharos-sky)"}` }}
                  >
                    <CardContent className="p-5 flex items-center gap-5">
                      {/* Date badge */}
                      <div
                        className="shrink-0 text-center rounded-xl p-3 min-w-[60px]"
                        style={{ background: "rgba(90,112,85,0.10)" }}
                      >
                        <p
                          className="text-2xl font-bold tabular-nums leading-none"
                          style={{ color: "var(--pharos-forest)", fontFamily: "var(--font-editorial)" }}
                        >
                          {fmtDate(snapshot.snapshot_date, "dd")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmtDate(snapshot.snapshot_date, "MMM yy")}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate" style={{ color: "var(--pharos-forest)" }}>
                          {snapshot.headline}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {snapshot.summary_text}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Photo grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-14">
          {["Community Gathering", "Education Program", "Safehouse Life"].map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div
                className="rounded-2xl aspect-video flex flex-col items-center justify-center border border-border/60 gap-2 relative overflow-hidden shadow-sm"
                style={{
                  background:
                    i === 0
                      ? "linear-gradient(135deg, rgba(90,112,85,0.10) 0%, rgba(90,112,85,0.05) 100%)"
                      : i === 1
                      ? "linear-gradient(135deg, rgba(176,196,216,0.12) 0%, rgba(176,196,216,0.06) 100%)"
                      : "linear-gradient(135deg, rgba(245,184,184,0.12) 0%, rgba(245,184,184,0.06) 100%)",
                }}
              >
                {/* Decorative ring */}
                <div
                  className="absolute h-24 w-24 rounded-full border opacity-20"
                  style={{
                    borderColor:
                      i === 0 ? "var(--pharos-sage)" : i === 1 ? "var(--pharos-sky)" : "var(--pharos-blush)",
                  }}
                />
                <span className="relative text-sm font-medium text-muted-foreground/80">{label}</span>
                <span className="relative text-xs text-muted-foreground/50">Photo coming soon</span>
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
          className="rounded-3xl overflow-hidden relative"
          style={{
            background:
              "linear-gradient(135deg, var(--pharos-forest) 0%, var(--pharos-sage) 100%)",
          }}
        >
          {/* Beacon rays watermark */}
          <BeaconRays
            className="right-0 top-0 h-full w-1/2 text-white opacity-[0.07]"
            rays={7}
          />
          {/* Blush blob */}
          <div
            className="absolute -top-10 right-1/4 h-60 w-60 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(245,184,184,0.20)" }}
          />

          <div className="relative p-10 sm:p-14 text-center">
            <img
              src="/images/pharos-logo.png"
              alt="Pharos"
              className="mx-auto h-14 w-14 object-contain mb-5 drop-shadow-xl"
            />
            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl text-white"
              style={{ fontFamily: "var(--font-editorial)" }}
            >
              Inspired? Become a supporter today.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/70">
              Your generosity directly funds the safety, education, and healing
              of girls who need it most.
            </p>
            <div className="mt-8">
              <Link to="/register">
                <Button
                  size="lg"
                  className="gap-2 shadow-xl font-semibold"
                  style={{ background: "var(--pharos-blush)", color: "#5a1a1a" }}
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
