import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/StatCard";
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

const impactStats = [
  { label: "Girls Served", value: 60, icon: Users, suffix: "+" },
  { label: "Safehouses", value: 9, icon: Building2 },
  { label: "Donations Received", value: 420, icon: HandHeart, suffix: "+" },
  { label: "Regions Covered", value: 3, icon: Globe },
];

const pillars = [
  { title: "Safety", description: "Providing secure, loving environments where every girl can feel protected and begin to heal.", icon: Shield, color: "text-blue-500" },
  { title: "Healing", description: "Professional counseling, therapy, and emotional support to process trauma and build resilience.", icon: Heart, color: "text-rose-500" },
  { title: "Justice", description: "Legal advocacy and support to ensure every child's rights are protected and upheld.", icon: Scale, color: "text-amber-500" },
  { title: "Empowerment", description: "Education, skills training, and mentorship to build confidence and independence.", icon: Sparkles, color: "text-emerald-500" },
];

const steps = [
  { title: "We Rescue", description: "Working with DSWD and partner agencies to identify and rescue children in danger." },
  { title: "We Rehabilitate", description: "Comprehensive care including counseling, education, health services, and life skills." },
  { title: "We Reintegrate", description: "Careful family reunification or placement, with ongoing monitoring and support." },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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

export default function LandingPage() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-50px" });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              A Beacon of Hope
              <br />
              <span className="text-primary">for Every Girl</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              Pharos provides safety, healing, and a path to a brighter future
              for girls who are survivors of abuse and trafficking in the
              Philippines.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <Link to="/impact">
                <Button size="lg" className="w-full sm:w-auto gap-2">
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
          </motion.div>
        </div>
      </section>

      {/* Impact Stats Strip */}
      <section
        ref={statsRef}
        className="border-y bg-muted/30 py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {impactStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={
                    statsInView
                      ? { opacity: 1, scale: 1 }
                      : {}
                  }
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight tabular-nums">
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Four Pillars */}
      <AnimatedSection
        className="py-20 sm:py-24"
      >
        <div id="mission" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Four Pillars
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A comprehensive approach to restoration and empowerment.
            </p>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <motion.div key={pillar.title} variants={staggerItem}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 17,
                    }}
                  >
                    <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div
                          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${pillar.color}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold">
                          {pillar.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {pillar.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* How It Works */}
      <AnimatedSection className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our proven three-step approach to lasting transformation.
            </p>
          </div>
          <div className="relative mx-auto max-w-4xl">
            <div className="hidden lg:block absolute top-8 left-[16.7%] right-[16.7%] h-0.5 bg-border" />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-3"
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={staggerItem}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-lg">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center sm:px-16">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Join Our Mission
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Every contribution brings us closer to a world where every girl
                is safe, healed, and empowered.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto gap-2"
                  >
                    Become a Supporter
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/impact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    View Impact
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
