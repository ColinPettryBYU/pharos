import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { mockImpactSnapshots } from "@/lib/mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Users, GraduationCap, HeartPulse, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";

const trendData = [
  { month: "Jan", education: 55, health: 3.2, sessions: 120 },
  { month: "Feb", education: 58, health: 3.3, sessions: 135 },
  { month: "Mar", education: 60, health: 3.5, sessions: 140 },
  { month: "Apr", education: 63, health: 3.6, sessions: 150 },
  { month: "May", education: 65, health: 3.7, sessions: 155 },
  { month: "Jun", education: 68, health: 3.8, sessions: 160 },
  { month: "Jul", education: 70, health: 3.9, sessions: 165 },
  { month: "Aug", education: 72, health: 4.0, sessions: 170 },
  { month: "Sep", education: 74, health: 4.0, sessions: 175 },
  { month: "Oct", education: 76, health: 4.1, sessions: 178 },
  { month: "Nov", education: 78, health: 4.2, sessions: 182 },
  { month: "Dec", education: 80, health: 4.3, sessions: 188 },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ImpactDashboard() {
  const chartsRef = useRef(null);
  const chartsInView = useInView(chartsRef, { once: true, margin: "-50px" });
  const latest = mockImpactSnapshots[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Impact Dashboard"
        description="Transparent, real-time data on how your support is making a difference."
      />

      {/* Latest Headline */}
      {latest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Badge variant="secondary" className="mb-2">
                  Latest Report
                </Badge>
                <h3 className="text-lg font-semibold">{latest.headline}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {latest.summary_text}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Key Metrics */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        <motion.div variants={item}>
          <StatCard title="Residents Served" value={60} icon={Users} trend={{ value: 8, direction: "up" }} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Avg Education Progress" value={78} format="percent" icon={GraduationCap} trend={{ value: 12, direction: "up" }} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Avg Health Score" value={4.2} icon={HeartPulse} trend={{ value: 5, direction: "up" }} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard title="Active Safehouses" value={9} icon={Building2} />
        </motion.div>
      </motion.div>

      {/* Trend Charts */}
      <div ref={chartsRef} className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={chartsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Education Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorEdu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
                  <YAxis className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="education"
                    stroke="var(--color-primary)"
                    fill="url(#colorEdu)"
                    strokeWidth={2}
                    isAnimationActive={chartsInView}
                    animationBegin={200}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={chartsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Score Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
                  <YAxis domain={[2.5, 5]} className="text-xs" tick={{ fill: "var(--color-muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="health"
                    stroke="var(--color-success)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-success)", r: 4 }}
                    isAnimationActive={chartsInView}
                    animationBegin={200}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Regional Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regional Presence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {["Luzon", "Visayas", "Mindanao"].map((region, i) => (
                <div key={region} className="text-center p-6 rounded-xl bg-muted/50">
                  <h3 className="text-lg font-semibold">{region}</h3>
                  <p className="mt-1 text-3xl font-bold text-primary tabular-nums">
                    {[3, 3, 3][i]}
                  </p>
                  <p className="text-sm text-muted-foreground">Safehouses</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Published Snapshots */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <h2 className="text-xl font-semibold mb-4">Monthly Impact Reports</h2>
        <div className="space-y-4">
          {mockImpactSnapshots.map((snapshot) => (
            <motion.div key={snapshot.snapshot_id} variants={item}>
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="shrink-0 text-center">
                    <p className="text-2xl font-bold text-primary tabular-nums">
                      {format(new Date(snapshot.snapshot_date), "dd")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(snapshot.snapshot_date), "MMM yyyy")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">
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
        </div>
      </motion.div>
    </div>
  );
}
