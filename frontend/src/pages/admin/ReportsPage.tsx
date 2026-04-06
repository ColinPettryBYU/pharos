import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { mockDonationTrends } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format } from "date-fns";
import { Target, TrendingUp, DollarSign, GraduationCap, HeartPulse, Users, Share2 } from "lucide-react";

const donationChartData = mockDonationTrends.map((d) => ({
  month: format(new Date(d.month + "-01"), "MMM"),
  total: d.total,
  monetary: d.monetary,
  inKind: d.inKind,
  recurring: d.recurring,
  oneTime: d.oneTime,
}));

const outcomeData = [
  { month: "Jul", education: 62, health: 3.5, emotional: 55 },
  { month: "Aug", education: 65, health: 3.6, emotional: 58 },
  { month: "Sep", education: 68, health: 3.7, emotional: 62 },
  { month: "Oct", education: 72, health: 3.9, emotional: 65 },
  { month: "Nov", education: 75, health: 4.0, emotional: 68 },
  { month: "Dec", education: 78, health: 4.2, emotional: 72 },
];

const reintegrationFunnel = [
  { stage: "Not Started", count: 20 },
  { stage: "In Progress", count: 25 },
  { stage: "On Hold", count: 5 },
  { stage: "Completed", count: 10 },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function ReportsPage() {
  const totalDonations = mockDonationTrends.reduce((s, d) => s + d.total, 0);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive reporting across donations, outcomes, and social media."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports" },
        ]}
      />

      {/* OKR Metric */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Key Result: Resident Progress Score</h3>
                <p className="text-sm text-muted-foreground">Composite measure of education, health, and emotional improvement across all active residents</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary tabular-nums">78%</p>
                <p className="text-sm text-success font-medium">+12% this quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="donations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="outcomes">Resident Outcomes</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        {/* Donation Reports */}
        <TabsContent value="donations" className="space-y-6">
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <motion.div variants={item}><StatCard title="Annual Donations" value={totalDonations} format="currency" icon={DollarSign} /></motion.div>
            <motion.div variants={item}><StatCard title="Avg Monthly" value={totalDonations / 12} format="currency" icon={TrendingUp} /></motion.div>
            <motion.div variants={item}><StatCard title="Active Supporters" value={48} icon={Users} /></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Donation Trends</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={donationChartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]} contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="total" stroke="var(--color-primary)" fill="url(#colorTotal)" strokeWidth={2} animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">By Type (Stacked)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={donationChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), ""]} contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="recurring" stackId="a" fill="var(--color-chart-1)" name="Recurring" animationDuration={800} />
                    <Bar dataKey="oneTime" stackId="a" fill="var(--color-chart-2)" name="One-Time" radius={[4, 4, 0, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resident Outcomes */}
        <TabsContent value="outcomes" className="space-y-6">
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <motion.div variants={item}><StatCard title="Avg Education Progress" value={78} format="percent" icon={GraduationCap} trend={{ value: 12, direction: "up" }} /></motion.div>
            <motion.div variants={item}><StatCard title="Avg Health Score" value={4.2} icon={HeartPulse} trend={{ value: 8, direction: "up" }} /></motion.div>
            <motion.div variants={item}><StatCard title="Reintegrations Completed" value={10} icon={Users} /></motion.div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Outcome Trends</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={outcomeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Legend />
                    <Line type="monotone" dataKey="education" stroke="var(--color-chart-1)" strokeWidth={2} name="Education %" animationDuration={1000} />
                    <Line type="monotone" dataKey="emotional" stroke="var(--color-chart-3)" strokeWidth={2} name="Emotional %" animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Reintegration Funnel</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reintegrationFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis type="category" dataKey="stage" width={100} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Media Reports */}
        <TabsContent value="social" className="space-y-6">
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <motion.div variants={item}><StatCard title="Total Posts" value={812} icon={Share2} /></motion.div>
            <motion.div variants={item}><StatCard title="Avg Engagement" value={4.7} format="percent" icon={TrendingUp} /></motion.div>
            <motion.div variants={item}><StatCard title="Donation Referrals" value={156} icon={DollarSign} /></motion.div>
          </motion.div>
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Share2 className="mx-auto h-12 w-12 mb-4 text-primary/30" />
              <h3 className="text-lg font-semibold text-foreground">Social Media Reports</h3>
              <p className="mt-1">Detailed cross-platform analysis, content effectiveness, and donation attribution reports are available in the Social Media Command Center.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
