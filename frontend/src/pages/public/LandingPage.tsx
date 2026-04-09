import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/StatCard";
import { usePublicSafehouses } from "@/hooks/usePublicData";
import {
  Shield,
  Heart,
  Scale,
  Sparkles,
  ArrowRight,
  HandHeart,
  Users,
  Building2,
  Globe,
  ChevronRight,
} from "lucide-react";

// ─── Decorative Components ────────────────────────────────────────────────────

/** Soft conic-gradient light beam — looks like a lighthouse beacon */
function LightBeam({ className = "", from = "0% 50%" }: { className?: string; from?: string }) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        background: `conic-gradient(
          from 155deg at ${from},
          transparent 0deg,
          rgba(245,184,184,0.13) 8deg,
          transparent 18deg,
          rgba(176,196,216,0.10) 28deg,
          transparent 40deg,
          rgba(245,184,184,0.09) 52deg,
          transparent 64deg,
          rgba(176,196,216,0.07) 76deg,
          transparent 90deg,
          rgba(245,184,184,0.06) 105deg,
          transparent 120deg
        )`,
      }}
    />
  );
}

function WaveDivider({ fill = "var(--pharos-cream)", flip = false }: { fill?: string; flip?: boolean }) {
  return (
    <div className={`relative w-full leading-[0] ${flip ? "rotate-180" : ""}`}>
      <svg viewBox="0 0 1440 80" fill="none" className="block w-full" preserveAspectRatio="none">
        <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,80 L0,80 Z" fill={fill} />
      </svg>
    </div>
  );
}

function AnimatedSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const pillars = [
  {
    title: "Safety",
    description: "Secure, loving environments where every girl can feel protected and begin to heal.",
    icon: Shield,
    accent: "var(--pharos-sky)",
  },
  {
    title: "Healing",
    description: "Professional counseling, therapy, and emotional support to process trauma and build resilience.",
    icon: Heart,
    accent: "var(--pharos-blush)",
  },
  {
    title: "Justice",
    description: "Legal advocacy and support to ensure every child's rights are protected and upheld.",
    icon: Scale,
    accent: "#f0c96e",
  },
  {
    title: "Empowerment",
    description: "Education, skills training, and mentorship to build confidence and independence.",
    icon: Sparkles,
    accent: "var(--pharos-sage)",
  },
];

const stories = [
  {
    pillar: "Safety",
    icon: Shield,
    panelBg: "var(--pharos-sky)",
    panelFg: "var(--pharos-forest)",
    quote: "When Maria* arrived at our safehouse at age 9, she hadn't slept through the night in over a year. Within three months, surrounded by caregivers who never left, she slept through her first full night — and woke up smiling.",
    heading: "A Safe Place to Rest",
    description: "Our safehouses provide 24/7 security, trauma-informed care, and the steady presence every child needs to begin feeling safe again.",
  },
  {
    pillar: "Healing",
    icon: Heart,
    panelBg: "var(--pharos-blush)",
    panelFg: "var(--pharos-forest)",
    quote: "Through weekly art therapy sessions, Ana* found a way to express feelings she couldn't yet put into words. Her first painting was entirely black. Six months later, she painted a garden — and asked to hang it on her wall.",
    heading: "Finding Voice Through Art",
    description: "Professional counselors use play therapy, art, and group sessions to help each girl process trauma at her own pace, rebuilding trust and self-worth.",
  },
  {
    pillar: "Justice",
    icon: Scale,
    panelBg: "#fde68a",
    panelFg: "#713f12",
    quote: "With the support of our legal advocacy team, Joy* saw her case through the courts over 18 difficult months. On the day the verdict was read, she stood tall and said, 'They believed me.'",
    heading: "Her Day in Court",
    description: "Our legal team walks alongside every girl through the justice system — preparing testimony, attending hearings, and ensuring her rights are protected at every step.",
  },
  {
    pillar: "Empowerment",
    icon: Sparkles,
    panelBg: "var(--pharos-sage)",
    panelFg: "#fff",
    quote: "After completing her vocational training in tailoring, Rosa* started her own small alterations business in her hometown. She now supports herself and mentors two younger girls in the program.",
    heading: "Building a Future",
    description: "Through education, vocational training, and mentorship, we equip each girl with the skills and confidence to write her own next chapter.",
  },
];

const steps = [
  { num: "01", title: "We Rescue", description: "Working with DSWD and partner agencies to identify and rescue children in danger." },
  { num: "02", title: "We Rehabilitate", description: "Comprehensive care including counseling, education, health services, and life skills." },
  { num: "03", title: "We Reintegrate", description: "Careful family reunification or placement, with ongoing monitoring and support." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });
  const timelineRef = useRef(null);
  const timelineInView = useInView(timelineRef, { once: true, margin: "-80px" });
  const quoteRef = useRef(null);
  const quoteInView = useInView(quoteRef, { once: true, margin: "-80px" });
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  const { data: summary } = usePublicSafehouses();

  const impactStats = [
    { label: "Girls Served", value: summary?.total_residents ?? 0, icon: Users, suffix: "+", accent: "var(--pharos-sky)" },
    { label: "Safehouses", value: summary?.total_safehouses ?? 0, icon: Building2, accent: "var(--pharos-sage)" },
    { label: "Donations Received", value: summary?.total_donations ?? 0, icon: HandHeart, suffix: "+", accent: "var(--pharos-blush)" },
    { label: "Regions Covered", value: summary?.regions_count ?? 0, icon: Globe, accent: "#f0c96e" },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background photo */}
        <img src="/images/girlsreadingstock.png" alt="Girls reading together" className="absolute inset-0 h-full w-full object-cover" />

        {/* Near-black warm overlay — NOT heavy green */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(20,20,18,0.92) 0%, rgba(30,35,28,0.78) 40%, rgba(40,42,38,0.40) 70%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,20,18,0.55) 0%, transparent 45%)" }} />

        {/* Soft lighthouse-beam light rays from right — conic gradient */}
        <LightBeam className="top-0 right-0 h-full w-[65%]" from="0% 40%" />

        {/* Colored ambient blobs */}
        <div className="pointer-events-none absolute top-[15%] right-[20%] h-[450px] w-[450px] rounded-full blur-[130px]" style={{ background: "rgba(176,196,216,0.22)" }} />
        <div className="pointer-events-none absolute bottom-[10%] right-[5%] h-72 w-72 rounded-full blur-[100px]" style={{ background: "rgba(245,184,184,0.18)" }} />
        <div className="pointer-events-none absolute top-[60%] left-[5%] h-48 w-48 rounded-full blur-3xl" style={{ background: "rgba(90,112,85,0.15)" }} />

        {/* Floating shapes */}
        <div className="pointer-events-none absolute top-[22%] right-[8%] h-20 w-20 rounded-full border" style={{ borderColor: "rgba(245,184,184,0.20)", animation: "float-slow-global 9s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute top-[40%] right-[18%] h-10 w-10 rounded-xl rotate-12" style={{ background: "rgba(176,196,216,0.12)", animation: "float-medium-global 6s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute bottom-[25%] right-[6%] h-7 w-7 rounded-lg border rotate-45" style={{ borderColor: "rgba(245,184,184,0.18)", animation: "float-fast-global 5s ease-in-out infinite" }} />

        {/* Content */}
        <div className="relative mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3 mb-6">
              <img src="/images/pharos-logo.png" alt="Pharos" className="h-10 w-10 object-contain drop-shadow-lg" />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ color: "var(--pharos-blush)" }}>
                Pharos Foundation · Philippines
              </span>
            </motion.div>

            {/* Headline — editorial serif */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="leading-[1.08] text-white drop-shadow-lg"
              style={{ fontFamily: "var(--font-editorial)", fontSize: "clamp(3rem, 7vw, 5.5rem)", fontWeight: 600 }}
            >
              A Beacon of Hope
              <br />
              <em className="not-italic" style={{ color: "var(--pharos-blush)" }}>for Every Girl</em>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Pharos provides safety, healing, and a path to a brighter future for girls who are survivors of abuse and trafficking in the Philippines.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to="/impact">
                <Button size="lg" className="w-full gap-2 sm:w-auto shadow-lg bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                  See Our Impact
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#mission">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/15 hover:border-white/60 backdrop-blur font-medium">
                  Our Mission
                </Button>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ─── STATS STRIP ───────────────────────────────────────────────────── */}
      <section ref={statsRef} className="relative py-16 sm:py-20 bg-muted/40 dark:bg-muted/20">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-10 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--pharos-sage)" }}>
            Our Reach
          </motion.p>

          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {impactStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }}>
                  <div className="rounded-2xl bg-card border border-border/60 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${stat.accent} 20%, transparent)` }}>
                      <Icon className="h-6 w-6" style={{ color: stat.accent }} />
                    </div>
                    <div className="text-4xl font-bold tracking-tight tabular-nums text-foreground">
                      {statsInView ? <AnimatedNumber value={stat.value} /> : "0"}
                      {stat.suffix && <span style={{ color: "var(--pharos-sage)" }}>{stat.suffix}</span>}
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── MISSION ───────────────────────────────────────────────────────── */}
      <AnimatedSection id="mission" className="relative py-20 sm:py-28 overflow-hidden">
        {/* Ambient blobs — blush + sky (not green) */}
        <div className="absolute -top-40 -right-40 h-[550px] w-[550px] rounded-full pointer-events-none blur-[120px]" style={{ background: "rgba(245,184,184,0.16)" }} />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full pointer-events-none blur-3xl" style={{ background: "rgba(176,196,216,0.14)" }} />

        {/* Watermark rings */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 h-[500px] w-[500px] rounded-full border-[2px] pointer-events-none" style={{ borderColor: "rgba(176,196,216,0.10)" }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 h-[340px] w-[340px] rounded-full border pointer-events-none" style={{ borderColor: "rgba(176,196,216,0.06)" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Text + pillars */}
            <div className="order-2 lg:order-1">
              <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 block" style={{ color: "var(--pharos-sage)" }}>What We Do</span>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>Our Mission</h2>
              <div className="mt-2 h-1 w-16 rounded-full" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush))" }} />
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                We operate safe homes in the Philippines for girls who are survivors of sexual abuse and sex trafficking. Through our four pillars, we guide each girl from crisis to confidence.
              </p>

              {/* Pillar cards — horizontal feel, left border accent */}
              <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pillars.map((pillar, i) => {
                  const Icon = pillar.icon;
                  return (
                    <motion.div
                      key={pillar.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                    >
                      <Card className="h-full border-border/60 overflow-hidden group hover:shadow-md transition-shadow" style={{ borderLeft: `3px solid ${pillar.accent}` }}>
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${pillar.accent} 18%, transparent)` }}>
                            <Icon className="h-4.5 w-4.5" style={{ color: pillar.accent }} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold" style={{ color: "var(--pharos-forest)" }}>{pillar.title}</h3>
                            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{pillar.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Image */}
            <motion.div className="order-1 lg:order-2" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7, ease: "easeOut" }}>
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl blur-2xl" style={{ background: "linear-gradient(135deg, rgba(176,196,216,0.20) 0%, rgba(245,184,184,0.18) 100%)" }} />
                <img src="/images/girlwomentalkingstock.png" alt="Mentoring conversation" className="relative max-h-[520px] w-full rounded-2xl object-cover shadow-2xl" />
                {/* Badge */}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, type: "spring", stiffness: 200 }} className="absolute -bottom-5 -left-5 rounded-2xl p-4 shadow-xl border border-border/60 backdrop-blur-sm bg-card/95">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--pharos-blush)" }}>
                      <Heart className="h-5 w-5" style={{ color: "var(--pharos-forest)" }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--pharos-forest)" }}>{summary?.total_residents ?? "60"}+</p>
                      <p className="text-xs text-muted-foreground font-medium">Lives Transformed</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── STORIES ───────────────────────────────────────────────────────── */}
      <AnimatedSection className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full pointer-events-none blur-[120px]" style={{ background: "rgba(176,196,216,0.15)" }} />
        <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full pointer-events-none blur-3xl" style={{ background: "rgba(245,184,184,0.12)" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 block" style={{ color: "var(--pharos-sage)" }}>Real Stories</span>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>Stories of Transformation</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush))" }} />
            <p className="mt-5 text-lg text-muted-foreground">Behind every number is a girl with a name, a story, and a future worth fighting for.</p>
          </div>

          <div className="space-y-6">
            {stories.map((story, i) => {
              const Icon = story.icon;
              const isEven = i % 2 === 0;
              return (
                <motion.div key={story.pillar} initial={{ opacity: 0, x: isEven ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}>
                  <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>
                        {/* Colored panel */}
                        <div className="flex flex-col items-center justify-center gap-3 px-8 py-8 md:w-48 md:shrink-0" style={{ background: story.panelBg }}>
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm" style={{ background: "rgba(255,255,255,0.35)" }}>
                            <Icon className="h-7 w-7" style={{ color: story.panelFg }} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: story.panelFg }}>{story.pillar}</span>
                        </div>
                        {/* Content */}
                        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 flex-1">
                          <h3 className="text-xl font-semibold" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>{story.heading}</h3>
                          <blockquote className="border-l-2 pl-4 text-[0.95rem] italic leading-relaxed text-muted-foreground" style={{ borderColor: "var(--pharos-sky)" }}>
                            &ldquo;{story.quote}&rdquo;
                          </blockquote>
                          <p className="text-sm leading-relaxed text-muted-foreground/80">{story.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-10 text-center text-xs text-muted-foreground/60">
            *Names changed to protect the identities of the girls in our care.
          </motion.p>
        </div>
      </AnimatedSection>

      {/* ─── TIMELINE ──────────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden" style={{ background: "var(--pharos-cream)" }}>
        {/* Soft light beam in background */}
        <LightBeam className="bottom-0 right-0 h-2/3 w-1/2" from="100% 100%" />

        <div ref={timelineRef} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={timelineInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 block" style={{ color: "var(--pharos-sage)" }}>Our Approach</span>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>How It Works</h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush))" }} />
            <p className="mt-5 text-lg text-muted-foreground">Our proven three-step approach to lasting transformation.</p>
          </motion.div>

          <div className="relative mx-auto max-w-4xl">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-10 left-[16.7%] right-[16.7%] h-0.5" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush), var(--pharos-sky))" }} />

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
              {steps.map((step, i) => (
                <motion.div key={step.title} initial={{ opacity: 0, y: 30 }} animate={timelineInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.18, type: "spring", stiffness: 150, damping: 22 }} className="relative flex items-start gap-5 lg:flex-col lg:items-center lg:text-center">
                  {/* Step circle — blush/sky alternating */}
                  <div className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full shadow-lg" style={{ background: i === 1 ? "var(--pharos-blush)" : "var(--pharos-sky)" }}>
                    <div className="absolute -inset-3 rounded-full border-2" style={{ borderColor: i === 1 ? "rgba(245,184,184,0.25)" : "rgba(176,196,216,0.25)", animation: `beacon-pulse 3s ease-in-out infinite ${i * 0.5}s` }} />
                    <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-editorial)", color: i === 1 ? "var(--pharos-forest)" : "var(--pharos-forest)" }}>{step.num}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: "var(--pharos-forest)" }}>{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUOTE ─────────────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-background">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-[600px] w-[600px] rounded-full blur-[140px]" style={{ background: "rgba(176,196,216,0.15)" }} />
        </div>
        <div className="absolute top-0 left-[8%] h-48 w-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(245,184,184,0.12)" }} />

        <div ref={quoteRef} className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={quoteInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 1, ease: "easeOut" }}>
            <div className="mx-auto mb-6 text-[8rem] leading-none select-none" style={{ color: "color-mix(in srgb, var(--pharos-sky) 35%, transparent)", fontFamily: "var(--font-editorial)" }} aria-hidden="true">&ldquo;</div>
            <blockquote className="-mt-12 text-2xl font-semibold italic leading-relaxed tracking-tight sm:text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>
              Every girl who walks through our doors deserves<br className="hidden sm:block" /> a chance to dream again.
            </blockquote>
            <div className="mx-auto mt-6 h-px w-16 rounded-full" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush))" }} />
            <p className="mt-4 text-base font-medium text-muted-foreground">— Pharos Foundation</p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="relative py-20 sm:py-28" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3d2b3d 100%)" }}>
          {/* Soft light beams */}
          <LightBeam className="top-0 left-0 h-full w-1/2" from="0% 30%" />
          <LightBeam className="bottom-0 right-0 h-full w-1/2" from="100% 70%" />

          {/* Colored blobs for warmth */}
          <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(245,184,184,0.15)" }} />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full blur-[80px] pointer-events-none" style={{ background: "rgba(176,196,216,0.12)" }} />

          {/* Floating shapes */}
          <div className="pointer-events-none absolute top-[15%] left-[10%] h-16 w-16 rounded-full border border-white/10" style={{ animation: "float-slow-global 10s ease-in-out infinite" }} />
          <div className="pointer-events-none absolute bottom-[20%] right-[8%] h-12 w-12 rounded-xl rotate-12" style={{ background: "rgba(245,184,184,0.08)", animation: "float-medium-global 7s ease-in-out infinite" }} />

          <div ref={ctaRef} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: "easeOut" }} className="mx-auto max-w-2xl text-center">
              <motion.img src="/images/pharos-logo.png" alt="Pharos" className="mx-auto h-16 w-16 object-contain mb-6 drop-shadow-xl" initial={{ opacity: 0, scale: 0.8 }} animate={ctaInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} />
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-white" style={{ fontFamily: "var(--font-editorial)" }}>Join Our Mission</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/65">Every contribution brings us closer to a world where every girl is safe, healed, and empowered.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/register">
                  <Button size="lg" className="w-full gap-2 sm:w-auto shadow-xl font-semibold bg-white text-gray-900 hover:bg-gray-100">
                    Become a Supporter
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/impact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                    View Impact
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
