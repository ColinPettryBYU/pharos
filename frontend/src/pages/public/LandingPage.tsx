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

const floatKeyframes = `
@keyframes float-slow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}
@keyframes float-medium {
  0%, 100% { transform: translateY(0) rotate(12deg); }
  50% { transform: translateY(-15px) rotate(18deg); }
}
@keyframes float-fast {
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}
`;

const pillars = [
  {
    title: "Safety",
    description:
      "Providing secure, loving environments where every girl can feel protected and begin to heal.",
    icon: Shield,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Healing",
    description:
      "Professional counseling, therapy, and emotional support to process trauma and build resilience.",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    title: "Justice",
    description:
      "Legal advocacy and support to ensure every child's rights are protected and upheld.",
    icon: Scale,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Empowerment",
    description:
      "Education, skills training, and mentorship to build confidence and independence.",
    icon: Sparkles,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

const stories = [
  {
    pillar: "Safety",
    icon: Shield,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-l-blue-500",
    quote:
      "When Maria* arrived at our safehouse at age 9, she hadn't slept through the night in over a year. She flinched at every sound, every shadow. Within three months, surrounded by caregivers who never left, she slept through her first full night — and woke up smiling.",
    heading: "A Safe Place to Rest",
    description:
      "Our safehouses provide 24/7 security, trauma-informed care, and the steady presence every child needs to begin feeling safe again.",
  },
  {
    pillar: "Healing",
    icon: Heart,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-l-rose-500",
    quote:
      "Through weekly art therapy sessions, Ana* found a way to express feelings she couldn't yet put into words. Her first painting was entirely black. Six months later, she painted a garden — and asked to hang it on her wall.",
    heading: "Finding Voice Through Art",
    description:
      "Professional counselors use play therapy, art, and group sessions to help each girl process trauma at her own pace, rebuilding trust and self-worth.",
  },
  {
    pillar: "Justice",
    icon: Scale,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-l-amber-500",
    quote:
      "With the support of our legal advocacy team, Joy* saw her case through the courts over 18 difficult months. On the day the verdict was read, she stood tall and said, 'They believed me.'",
    heading: "Her Day in Court",
    description:
      "Our legal team walks alongside every girl through the justice system — preparing testimony, attending hearings, and ensuring her rights are protected at every step.",
  },
  {
    pillar: "Empowerment",
    icon: Sparkles,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-l-emerald-500",
    quote:
      "After completing her vocational training in tailoring, Rosa* started her own small alterations business in her hometown. She now supports herself and mentors two younger girls in the program.",
    heading: "Building a Future",
    description:
      "Through education, vocational training, and mentorship, we equip each girl with the skills and confidence to write her own next chapter.",
  },
];

const steps = [
  {
    title: "We Rescue",
    description:
      "Working with DSWD and partner agencies to identify and rescue children in danger.",
  },
  {
    title: "We Rehabilitate",
    description:
      "Comprehensive care including counseling, education, health services, and life skills.",
  },
  {
    title: "We Reintegrate",
    description:
      "Careful family reunification or placement, with ongoing monitoring and support.",
  },
];

function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function WaveDivider({
  className = "fill-background",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <div className={`relative w-full leading-[0] ${flip ? "rotate-180" : ""}`}>
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z"
          className={className}
        />
      </svg>
    </div>
  );
}

function FlowingLines({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute inset-0 h-full w-full pointer-events-none opacity-[0.04] ${className}`}
      viewBox="0 0 1440 800"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M-100,400 C200,100 600,700 900,300 C1200,-100 1400,500 1540,200"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
      <path
        d="M-100,500 C300,200 500,600 800,400 C1100,200 1300,600 1540,300"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-accent"
      />
    </svg>
  );
}

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
    {
      label: "Girls Served",
      value: summary?.total_residents ?? 0,
      icon: Users,
      suffix: "+",
    },
    {
      label: "Safehouses",
      value: summary?.total_safehouses ?? 0,
      icon: Building2,
    },
    {
      label: "Donations Received",
      value: summary?.total_donations ?? 0,
      icon: HandHeart,
      suffix: "+",
    },
    {
      label: "Regions Covered",
      value: summary?.regions_count ?? 0,
      icon: Globe,
    },
  ];

  return (
    <div className="overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: floatKeyframes }} />

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <img
          src="/images/girlsreadingstock.png"
          alt="Girls reading together"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />

        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />

        {/* Floating geometric shapes in hero */}
        <div
          className="pointer-events-none absolute top-[20%] right-[8%] h-20 w-20 rounded-full border border-primary/10"
          style={{ animation: "float-slow 8s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute top-[35%] right-[15%] h-14 w-14 rounded-xl bg-accent/5 rotate-12"
          style={{ animation: "float-medium 6s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute bottom-[25%] right-[5%] h-10 w-10 rounded-lg border border-accent/10 rotate-45"
          style={{ animation: "float-fast 5s ease-in-out infinite" }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-center sm:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl"
            >
              A Beacon of Hope
              <br />
              <span className="text-primary">for Every Girl</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              Pharos provides safety, healing, and a path to a brighter future
              for girls who are survivors of abuse and trafficking in the
              Philippines.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link to="/impact">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  See Our Impact
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#mission">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section ref={statsRef} className="relative bg-muted/30 py-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {impactStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={statsInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="rounded-xl bg-card p-6 shadow-sm text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-4xl font-bold tracking-tight tabular-nums">
                      {statsInView ? (
                        <AnimatedNumber value={stat.value} />
                      ) : (
                        "0"
                      )}
                      {stat.suffix && (
                        <span className="text-primary">{stat.suffix}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── MISSION + IMAGE SPLIT ─── */}
      <AnimatedSection className="relative py-12 sm:py-16">
        <div className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-96 w-96 rounded-full bg-rose/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-primary/3 blur-3xl pointer-events-none" />

        <FlowingLines />

        {/* Floating shapes in mission section */}
        <div
          className="pointer-events-none absolute top-[10%] left-[5%] h-16 w-16 rounded-full border border-primary/8"
          style={{ animation: "float-slow 9s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute bottom-[15%] right-[10%] h-12 w-12 rounded-xl bg-accent/5 -rotate-12"
          style={{ animation: "float-medium 7s ease-in-out infinite" }}
        />

        <div
          id="mission"
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Text + pillars */}
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Our Mission
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                We operate safe homes in the Philippines for girls who are
                survivors of sexual abuse and sex trafficking. Through our four
                pillars, we guide each girl from crisis to confidence.
              </p>

              <div className="relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Dotted decorative border behind pillar cards */}
                <div className="pointer-events-none absolute -inset-3 rounded-2xl border border-dashed border-primary/8" />
                {pillars.map((pillar, i) => {
                  const Icon = pillar.icon;
                  return (
                    <motion.div
                      key={pillar.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    >
                      <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
                          <CardContent className="p-5">
                            <div
                              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${pillar.bg} ${pillar.color}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-semibold">
                              {pillar.title}
                            </h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                              {pillar.description}
                            </p>
                          </CardContent>
                        </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Image */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl" />
                <img
                  src="/images/girlwomentalkingstock.png"
                  alt="Mentoring conversation"
                  className="relative max-h-[500px] w-full rounded-2xl object-cover shadow-xl dark:brightness-90"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── STORIES / BLOG POSTS ─── */}
      <AnimatedSection className="relative py-20 sm:py-28">
        <FlowingLines />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stories of Transformation
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Behind every number is a girl with a name, a story, and a future
              worth fighting for.
            </p>
          </div>

          <div className="space-y-8 sm:space-y-12">
            {stories.map((story, i) => {
              const Icon = story.icon;
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={story.pillar}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                >
                  <Card
                    className={`overflow-hidden border-l-4 ${story.border} bg-card/80 backdrop-blur-sm`}
                  >
                    <CardContent className="p-0">
                      <div
                        className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
                      >
                        {/* Accent panel */}
                        <div
                          className={`flex flex-col items-center justify-center gap-3 px-8 py-8 md:w-48 md:shrink-0 ${story.bg}`}
                        >
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 shadow-sm ${story.color}`}
                          >
                            <Icon className="h-7 w-7" />
                          </div>
                          <span
                            className={`text-sm font-bold uppercase tracking-widest ${story.color}`}
                          >
                            {story.pillar}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                          <h3 className="text-xl font-semibold tracking-tight">
                            {story.heading}
                          </h3>
                          <blockquote className="border-l-2 border-muted-foreground/20 pl-4 text-[0.95rem] italic leading-relaxed text-muted-foreground">
                            &ldquo;{story.quote}&rdquo;
                          </blockquote>
                          <p className="text-sm leading-relaxed text-muted-foreground/80">
                            {story.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 text-center text-xs text-muted-foreground/60"
          >
            *Names changed to protect the identities of the girls in our care.
          </motion.p>
        </div>
      </AnimatedSection>

      {/* ─── HOW IT WORKS — TIMELINE ─── */}
      <section className="relative bg-muted/30">
        <WaveDivider className="fill-muted/30" />
        <div ref={timelineRef} className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={timelineInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-2xl text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our proven three-step approach to lasting transformation.
              </p>
            </motion.div>

            <div className="relative mx-auto max-w-4xl">
              {/* Desktop horizontal line */}
              <div className="hidden lg:block absolute top-8 left-[16.7%] right-[16.7%] h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

              {/* Mobile vertical line */}
              <div className="lg:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary to-primary/30" />

              <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      timelineInView ? { opacity: 1, scale: 1 } : {}
                    }
                    transition={{
                      duration: 0.5,
                      delay: i * 0.15,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    className="relative flex items-start gap-5 lg:flex-col lg:items-center lg:text-center"
                  >
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg">
                      {/* Dashed ring behind each step number */}
                      <div className="pointer-events-none absolute -inset-3 rounded-full border border-dashed border-primary/20" />
                      {i + 1}
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        timelineInView ? { opacity: 1, y: 0 } : {}
                      }
                      transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}
                    >
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUOTE ─── */}
      <section className="relative py-14 sm:py-18 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/8 via-accent/5 to-transparent blur-3xl" />
        </div>
        <div className="absolute top-0 left-[10%] h-96 w-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-[15%] h-80 w-80 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

        <div
          ref={quoteRef}
          className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={quoteInView ? { opacity: 1 } : {}}
            transition={{ duration: 1 }}
          >
            <svg
              className="mx-auto mb-6 h-12 w-12 text-primary/30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.198 0-2.252-.5-2.917-1.179zM15.583 17.321C14.553 16.227 14 15 14 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C20.591 11.69 22 13.166 22 15c0 1.933-1.567 3.5-3.5 3.5-1.198 0-2.252-.5-2.917-1.179z" />
            </svg>
            <blockquote className="text-2xl font-semibold italic leading-relaxed tracking-tight sm:text-3xl lg:text-4xl">
              Every girl who walks through our doors deserves a chance to dream
              again.
            </blockquote>
            <p className="mt-6 text-base font-medium text-muted-foreground">
              — Lighthouse Sanctuary
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA BLOCK ─── */}
      <section className="relative overflow-hidden">
        <WaveDivider className="fill-background" />

        <div className="relative min-h-[400px] flex items-center justify-center py-14 sm:py-20">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60 dark:from-primary/80 dark:via-primary/50 dark:to-accent/40"
          />

          {/* Floating shapes in CTA */}
          <div
            className="pointer-events-none absolute top-[15%] left-[10%] h-16 w-16 rounded-full border border-white/10"
            style={{ animation: "float-slow 10s ease-in-out infinite" }}
          />
          <div
            className="pointer-events-none absolute bottom-[20%] right-[8%] h-12 w-12 rounded-xl bg-white/5 rotate-12"
            style={{ animation: "float-medium 7s ease-in-out infinite" }}
          />
          <div
            className="pointer-events-none absolute top-[40%] right-[20%] h-8 w-8 rounded-lg border border-white/8 -rotate-6"
            style={{ animation: "float-fast 6s ease-in-out infinite" }}
          />

          <div
            ref={ctaRef}
            className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mx-auto max-w-2xl rounded-2xl bg-background/80 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Join Our Mission
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Every contribution brings us closer to a world where every girl
                is safe, healed, and empowered.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/register">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Become a Supporter
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/impact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
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
