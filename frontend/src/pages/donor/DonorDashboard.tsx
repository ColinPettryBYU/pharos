import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/shared/StatCard";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { useAuth } from "@/lib/auth";
import { useDonorProfile, useDonorDonations, useDonorImpact } from "@/hooks/useDonorPortal";
import { formatCurrency } from "@/lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { Donation } from "@/types";
import { fmtDate } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Heart, DollarSign, Calendar, Gift, TrendingUp,
  Building2, ArrowRight, Sparkles,
} from "lucide-react";

const COLORS = [
  "var(--pharos-forest)",
  "var(--pharos-sky)",
  "var(--pharos-blush)",
  "var(--color-chart-3)",
  "var(--color-chart-5)",
];

const donationCols: ColumnDef<Donation>[] = [
  {
    accessorKey: "donation_date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {fmtDate(row.getValue("donation_date"))}
      </span>
    ),
  },
  {
    accessorKey: "donation_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("donation_type") as string;
      const variant = type === "Monetary" ? "default" : "secondary";
      return <Badge variant={variant} className="font-medium text-xs">{type}</Badge>;
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums" style={{ color: "var(--pharos-forest)" }}>
        {formatCurrency(row.getValue("amount"))}
      </span>
    ),
  },
  {
    accessorKey: "campaign_name",
    header: "Campaign",
    cell: ({ row }) => {
      const name = row.getValue("campaign_name") as string | null;
      return name
        ? <Badge variant="outline" className="text-xs">{name}</Badge>
        : <span className="text-muted-foreground text-xs italic">General</span>;
    },
  },
];

const section = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function DonorDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useDonorProfile();
  const { data: donationsData, isLoading: donationsLoading } = useDonorDonations();
  const { data: impact, isLoading: impactLoading } = useDonorImpact();

  const donations: Donation[] = Array.isArray(donationsData) ? donationsData : (donationsData as any)?.data ?? [];
  const totalDonated = impact?.totalDonated ?? donations.reduce((s: number, d: Donation) => s + d.amount, 0);
  const isLoading = profileLoading || donationsLoading || impactLoading;

  const allocationByArea = (impact?.allocations ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.program_area] = (acc[a.program_area] || 0) + a.amount_allocated;
    return acc;
  }, {});
  const pieData = Object.entries(allocationByArea).map(([name, value]) => ({ name, value: Math.round(value) }));
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  const displayName = user?.display_name || profile?.display_name || "Valued Supporter";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* ── Welcome Hero ── */}
      <motion.div
        variants={section}
        initial="hidden"
        animate="show"
        className="mb-10"
      >
        <Card className="relative overflow-hidden rounded-xl border-0 shadow-lg">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `radial-gradient(ellipse at 20% 50%, var(--pharos-sky), transparent 60%),
                           radial-gradient(ellipse at 80% 50%, var(--pharos-blush), transparent 60%)`,
            }}
          />
          <CardContent className="relative p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                  Welcome back
                </p>
                <h1
                  className="text-3xl sm:text-4xl font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
                >
                  Thank you, {displayName}.
                </h1>
                <p className="text-base text-muted-foreground max-w-md">
                  Your generosity is creating real change. Here's your impact at a glance.
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Total Impact
                </p>
                {isLoading ? (
                  <Skeleton className="h-10 w-40 ml-auto" />
                ) : (
                  <div style={{ color: "var(--pharos-forest)" }}>
                    <AnimatedNumber value={totalDonated} format="currency" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  across {impact?.donationsCount ?? donations.length} donations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stat Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-10"
        >
          {[
            {
              label: "Total Donated",
              value: totalDonated,
              format: "currency" as const,
              icon: DollarSign,
              color: "var(--pharos-forest)",
              bg: "color-mix(in srgb, var(--pharos-forest) 12%, transparent)",
            },
            {
              label: "Donations Made",
              value: impact?.donationsCount ?? donations.length,
              format: "number" as const,
              icon: TrendingUp,
              color: "var(--pharos-sky)",
              bg: "color-mix(in srgb, var(--pharos-sky) 18%, transparent)",
            },
            {
              label: "Safehouses Reached",
              value: impact?.safehousesReached ?? 0,
              format: "number" as const,
              icon: Building2,
              color: "var(--pharos-blush)",
              bg: "color-mix(in srgb, var(--pharos-blush) 22%, transparent)",
            },
          ].map((stat) => (
            <motion.div key={stat.label} variants={cardItem}>
              <Card className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <div
                      className="rounded-xl p-2.5"
                      style={{ background: stat.bg }}
                    >
                      <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <div style={{ color: stat.color }}>
                    <AnimatedNumber value={stat.value} format={stat.format} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Allocation Pie Chart ── */}
      {pieData.length > 0 && (
        <motion.div
          variants={section}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <Card className="rounded-xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle
                className="text-lg"
                style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
              >
                Where Your Money Went
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Allocation across {pieData.length} program areas
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                        animationBegin={200}
                        animationDuration={1000}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [formatCurrency(Number(v)), "Allocated"]}
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "12px",
                          fontSize: "13px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend with exact amounts */}
                <div className="md:w-56 space-y-3">
                  {pieData.map((entry, i) => {
                    const pct = pieTotal > 0 ? ((entry.value / pieTotal) * 100).toFixed(0) : "0";
                    return (
                      <div key={entry.name} className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(entry.value)}
                            <span className="ml-1.5 opacity-60">({pct}%)</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Impact Story Card ── */}
      <motion.div
        variants={section}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.4 }}
        className="mb-10"
      >
        <Card className="rounded-xl border-border/50 shadow-sm overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              background: `linear-gradient(135deg, var(--pharos-blush), var(--pharos-sky))`,
            }}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
            style={{ background: "linear-gradient(to bottom, var(--pharos-blush), var(--pharos-sky))" }}
          />
          <CardContent className="relative p-8 flex flex-col sm:flex-row items-center gap-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--pharos-blush) 18%, transparent)" }}
            >
              <Sparkles className="h-8 w-8" style={{ color: "var(--pharos-blush)" }} />
            </div>
            <div className="text-center sm:text-left">
              <h3
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
              >
                Your Impact Story
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-xl">
                Your contributions have reached{" "}
                <strong className="text-foreground">{impact?.safehousesReached ?? 0} safehouses</strong> across
                the Philippines, providing education, healthcare, and counseling services to girls
                who need it most. Every peso directly funds their recovery and future.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Donation History ── */}
      <motion.div
        variants={section}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
            >
              Donation History
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {donations.length} donation{donations.length !== 1 ? "s" : ""} on record
            </p>
          </div>
        </div>
        <Card className="rounded-xl border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <DataTableWrapper
              columns={donationCols}
              data={donations}
              isLoading={donationsLoading}
              searchKey="campaign_name"
              searchPlaceholder="Filter by campaign..."
              pageSize={8}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── CTA Card ── */}
      <motion.div
        variants={section}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.6 }}
      >
        <div
          className="rounded-xl p-[1px]"
          style={{
            background: "linear-gradient(135deg, var(--pharos-sky), var(--pharos-blush), var(--pharos-forest))",
          }}
        >
          <Card className="rounded-[11px] border-0 overflow-hidden relative">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, var(--pharos-sky), transparent 60%),
                             radial-gradient(ellipse at 70% 50%, var(--pharos-blush), transparent 60%)`,
              }}
            />
            <CardContent className="relative p-8 sm:p-10 flex flex-col items-center text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl mb-5"
                style={{ background: "color-mix(in srgb, var(--pharos-sky) 18%, transparent)" }}
              >
                <Gift className="h-7 w-7" style={{ color: "var(--pharos-sky)" }} />
              </div>
              <h3
                className="text-2xl font-semibold mb-2"
                style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
              >
                Continue Making a Difference
              </h3>
              <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
                Every donation goes directly to supporting girls in our safehouses — funding
                their education, healing, and path toward a brighter future.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/impact">
                  <Button
                    size="lg"
                    className="gap-2 font-semibold rounded-xl px-6"
                    style={{ background: "var(--pharos-forest)", color: "white" }}
                  >
                    <Heart className="h-4 w-4" />
                    View Our Impact
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
