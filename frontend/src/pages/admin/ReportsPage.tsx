import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDonationReports, useOutcomeReports, useSafehouseReports, useSocialMediaReports } from "@/hooks/useReports";
import { useSocialMediaRecommendations, useInterventionEffectiveness } from "@/hooks/useML";
import { useSafehouses } from "@/hooks/useSafehouses";
import { formatCurrency } from "@/lib/api";
import {
  DollarSign,
  Users,
  GraduationCap,
  HeartPulse,
  Building2,
  Share2,
  TrendingUp,
  Lightbulb,
  Clock,
  BarChart3,
  Target,
  Megaphone,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fmtDate } from "@/lib/utils";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const tooltipStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
};

const axisTick = { fill: "var(--color-muted-foreground)", fontSize: 12 };

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Tab 1: Donation Trends
// ──────────────────────────────────────────────────
function DonationTrendsTab() {
  const { data, isLoading, error, refetch } = useDonationReports();

  if (error) return <ErrorState message="Failed to load donation reports" onRetry={refetch} />;

  const trends = data?.trends ?? [];
  const totalDonations = data?.totalDonations ?? 0;
  const activeSupporters = data?.activeSupporters ?? 0;

  const chartData = trends.map((d) => ({
    month: fmtDate(d.month ? d.month + "-01" : null, "MMM yyyy"),
    total: d.total,
    monetary: d.monetary,
    inKind: d.inKind,
  }));

  const recurringData = trends.map((d) => ({
    month: fmtDate(d.month ? d.month + "-01" : null, "MMM yyyy"),
    recurring: d.recurring,
    oneTime: d.oneTime,
  }));

  const typeBreakdown = trends.reduce(
    (acc, d) => {
      acc.monetary += d.monetary;
      acc.inKind += d.inKind;
      return acc;
    },
    { monetary: 0, inKind: 0 }
  );

  const pieData = [
    { name: "Monetary", value: typeBreakdown.monetary },
    { name: "In-Kind", value: typeBreakdown.inKind },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <StatsSkeleton count={3} />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-2">
          <motion.div variants={fadeUp}>
            <StatCard title="Total Donations" value={totalDonations} format="currency" icon={DollarSign} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard title="Active Supporters" value={activeSupporters} icon={Users} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard title="Monthly Avg" value={trends.length > 0 ? totalDonations / trends.length : 0} format="currency" icon={TrendingUp} />
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Donation Totals Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={axisTick} angle={-30} textAnchor="end" height={50} label={{ value: "Month", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} label={{ value: "Amount (₱)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Total"]} contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="total" stroke="var(--color-primary)" fill="url(#gradTotal)" strokeWidth={2} animationBegin={200} animationDuration={1000} animationEasing="ease-out" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No donation trend data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recurring vs One-Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {recurringData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={recurringData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={axisTick} angle={-30} textAnchor="end" height={50} label={{ value: "Month", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} label={{ value: "Amount (₱)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value))]} contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="recurring" name="Recurring" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} animationBegin={200} animationDuration={800} />
                        <Bar dataKey="oneTime" name="One-Time" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} animationBegin={400} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No recurring/one-time breakdown available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Donation Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={axisTick} angle={-30} textAnchor="end" height={50} label={{ value: "Month", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} label={{ value: "Amount (₱)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value))]} contentStyle={tooltipStyle} />
                        <Legend />
                        <Line type="monotone" dataKey="monetary" name="Monetary" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} animationBegin={200} animationDuration={1000} />
                        <Line type="monotone" dataKey="inKind" name="In-Kind" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} animationBegin={400} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No type breakdown data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monetary vs In-Kind Split</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, percent }: any) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} animationBegin={200} animationDuration={1000}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Number(value))]} contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No donation type data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Tab 2: Resident Outcomes
// ──────────────────────────────────────────────────
function ResidentOutcomesTab() {
  const { data, isLoading, error, refetch } = useOutcomeReports();
  const { data: interventions, isLoading: interventionsLoading } = useInterventionEffectiveness();

  if (error) return <ErrorState message="Failed to load outcome reports" onRetry={refetch} />;

  const outcomes = (data ?? {}) as Record<string, unknown>;
  const educationProgress = (outcomes.educationProgress as Array<{ month: string; avgProgress: number }>) ?? [];
  const healthTrends = (outcomes.healthTrends as Array<{ month: string; avgScore: number }>) ?? [];
  const emotionalStates = (outcomes.emotionalDistribution as Array<{ state: string; count: number }>) ?? [];
  const reintegrationBreakdown = (outcomes.reintegrationStatus as Array<{ status: string; count: number }>) ?? [];
  const interventionPlans = (outcomes.interventionCompletion as Array<{ category: string; completed: number; total: number }>) ?? [];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <StatsSkeleton count={4} />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
          <motion.div variants={fadeUp}>
            <StatCard title="Avg Education Progress" value={(outcomes.avgEducationProgress as number) ?? 0} format="percent" icon={GraduationCap} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard title="Avg Health Score" value={(outcomes.avgHealthScore as number) ?? 0} icon={HeartPulse} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard title="Reintegrated" value={(outcomes.reintegratedCount as number) ?? 0} icon={Users} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard title="Active Plans" value={(outcomes.activePlansCount as number) ?? 0} icon={Target} />
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Education Progress Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {educationProgress.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={educationProgress}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={axisTick} angle={-30} textAnchor="end" height={50} label={{ value: "Month", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} domain={[0, 100]} tickFormatter={(v) => `${v}%`} label={{ value: "Progress (%)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Avg Progress"]} contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="avgProgress" name="Avg Progress" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-chart-1)" }} animationBegin={200} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No education progress data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Health Score Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {healthTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={healthTrends}>
                        <defs>
                          <linearGradient id="gradHealth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={axisTick} angle={-30} textAnchor="end" height={50} label={{ value: "Month", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} domain={[0, 5]} label={{ value: "Health Score", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, "Avg Score"]} contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="avgScore" name="Avg Health Score" stroke="var(--color-chart-2)" fill="url(#gradHealth)" strokeWidth={2} animationBegin={200} animationDuration={1000} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No health trend data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emotional State Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  {emotionalStates.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={emotionalStates} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="count" nameKey="state" label={({ name, percent }: any) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} animationBegin={200} animationDuration={1000}>
                          {emotionalStates.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No emotional state data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reintegration Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {reintegrationBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reintegrationBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" tick={axisTick} label={{ value: "Residents", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis type="category" dataKey="status" width={100} tick={axisTick} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" name="Residents" fill="var(--color-primary)" radius={[0, 4, 4, 0]} animationBegin={200} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No reintegration data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {!interventionsLoading && interventions && interventions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                Intervention Plan Completion & Effectiveness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {interventionPlans.length > 0 && (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={interventionPlans}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="category" tick={axisTick} angle={-20} textAnchor="end" height={50} label={{ value: "Category", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                      <YAxis tick={axisTick} label={{ value: "Plans", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="completed" name="Completed" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total" name="Total" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="space-y-3">
                  {interventions.map((item) => (
                    <div key={item.plan_category} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.plan_category}</span>
                        <Badge variant="outline">{((item.effectiveness_score ?? 0) * 100).toFixed(0)}% effective</Badge>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.effectiveness_score ?? 0) * 100}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                      {(item.recommendations ?? []).length > 0 && (
                        <p className="text-xs text-muted-foreground">{(item.recommendations ?? [])[0]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Tab 3: Safehouse Comparisons
// ──────────────────────────────────────────────────
function SafehouseComparisonsTab() {
  const { data, isLoading, error, refetch } = useSafehouseReports();
  const { data: safehouses } = useSafehouses();

  if (error) return <ErrorState message="Failed to load safehouse reports" onRetry={refetch} />;

  const report = (data ?? {}) as Record<string, unknown>;
  const monthlyMetrics = (report.monthlyMetrics as Array<{
    safehouse_code: string;
    month: string;
    active_residents: number;
    avg_education_progress: number;
    avg_health_score: number;
    incident_count: number;
  }>) ?? [];

  const safehouseList = Array.isArray(safehouses) ? safehouses : (safehouses as any)?.data ?? [];
  const occupancyData = safehouseList.map((s: any) => ({
    name: s.safehouse_code,
    occupancy: s.current_occupancy,
    capacity: s.capacity_girls,
    rate: s.capacity_girls > 0 ? Math.round((s.current_occupancy / s.capacity_girls) * 100) : 0,
  }));

  const safehouseSummary = (report.safehouseSummary as Array<{
    safehouse_code: string;
    avgEducation: number;
    avgHealth: number;
    totalIncidents: number;
  }>) ?? [];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <StatsSkeleton count={3} />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-2">
          <motion.div variants={fadeUp}>
            <StatCard title="Total Safehouses" value={safehouseList.length} icon={Building2} />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard
              title="Total Occupancy"
              value={safehouseList.reduce((sum: number, s: any) => sum + s.current_occupancy, 0)}
              icon={Users}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard
              title="Avg Occupancy Rate"
              value={
                safehouseList.length > 0
                  ? safehouseList.reduce((sum: number, s: any) => sum + (s.capacity_girls > 0 ? (s.current_occupancy / s.capacity_girls) * 100 : 0), 0) / safehouseList.length
                  : 0
              }
              format="percent"
              icon={BarChart3}
            />
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Occupancy by Safehouse</CardTitle>
                </CardHeader>
                <CardContent>
                  {occupancyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={occupancyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tick={axisTick} label={{ value: "Safehouse", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} label={{ value: "Count", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="capacity" name="Capacity" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} animationBegin={200} animationDuration={800} />
                        <Bar dataKey="occupancy" name="Occupancy" fill="var(--color-primary)" radius={[4, 4, 0, 0]} animationBegin={400} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No safehouse occupancy data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Education & Health Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {safehouseSummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={safehouseSummary}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="safehouse_code" tick={axisTick} label={{ value: "Safehouse", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} label={{ value: "Score", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="avgEducation" name="Avg Education %" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} animationBegin={200} animationDuration={800} />
                        <Bar dataKey="avgHealth" name="Avg Health Score" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} animationBegin={400} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No comparison data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Incident Rates by Safehouse</CardTitle>
                </CardHeader>
                <CardContent>
                  {safehouseSummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={safehouseSummary}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="safehouse_code" tick={axisTick} label={{ value: "Safehouse", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} label={{ value: "Incidents", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="totalIncidents" name="Total Incidents" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} animationBegin={200} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No incident data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {!isLoading && monthlyMetrics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Metrics Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-3 py-2 font-medium text-muted-foreground">Safehouse</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground">Month</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground text-right">Residents</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground text-right">Edu Progress</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground text-right">Health Score</th>
                      <th className="px-3 py-2 font-medium text-muted-foreground text-right">Incidents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyMetrics.slice(0, 20).map((m, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">{m.safehouse_code}</td>
                        <td className="px-3 py-2 text-muted-foreground">{m.month}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{m.active_residents}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{m.avg_education_progress?.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right tabular-nums">{m.avg_health_score?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{m.incident_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Tab 4: Social Media
// ──────────────────────────────────────────────────
function SocialMediaTab() {
  const { data, isLoading, error, refetch } = useSocialMediaReports();
  const { data: recommendations, isLoading: recsLoading } = useSocialMediaRecommendations();

  if (error) return <ErrorState message="Failed to load social media reports" onRetry={refetch} />;

  const report = (data ?? {}) as Record<string, unknown>;
  const platformEngagement = (report.platformEngagement as Array<{ platform: string; avgEngagement: number; totalPosts: number; totalReach: number }>) ?? [];
  const postTypePerformance = (report.postTypePerformance as Array<{ postType: string; avgEngagement: number; avgReach: number }>) ?? [];
  const contentTopicPerformance = (report.contentTopicPerformance as Array<{ topic: string; avgEngagement: number; donationReferrals: number }>) ?? [];
  const donationAttribution = (report.donationAttribution as Array<{ platform: string; referrals: number; estimatedValue: number }>) ?? [];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <StatsSkeleton count={4} />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
          <motion.div variants={fadeUp}>
            <StatCard
              title="Total Posts"
              value={platformEngagement.reduce((s, p) => s + p.totalPosts, 0)}
              icon={Megaphone}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard
              title="Total Reach"
              value={platformEngagement.reduce((s, p) => s + p.totalReach, 0)}
              icon={Share2}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard
              title="Avg Engagement"
              value={
                platformEngagement.length > 0
                  ? platformEngagement.reduce((s, p) => s + p.avgEngagement, 0) / platformEngagement.length
                  : 0
              }
              format="percent"
              icon={TrendingUp}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <StatCard
              title="Donation Referrals"
              value={donationAttribution.reduce((s, d) => s + d.referrals, 0)}
              icon={DollarSign}
            />
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
            <Card><CardContent className="p-6"><ChartSkeleton /></CardContent></Card>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Engagement Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {platformEngagement.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={platformEngagement}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="platform" tick={axisTick} label={{ value: "Platform", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} label={{ value: "Engagement Rate", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(2)}%`, "Avg Engagement"]} contentStyle={tooltipStyle} />
                        <Bar dataKey="avgEngagement" name="Avg Engagement Rate" fill="var(--color-primary)" radius={[4, 4, 0, 0]} animationBegin={200} animationDuration={800}>
                          {platformEngagement.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No platform engagement data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Post Type Effectiveness</CardTitle>
                </CardHeader>
                <CardContent>
                  {postTypePerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={postTypePerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" tick={axisTick} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} label={{ value: "Engagement Rate", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis type="category" dataKey="postType" width={120} tick={{ ...axisTick, fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(2)}%`]} contentStyle={tooltipStyle} />
                        <Bar dataKey="avgEngagement" name="Avg Engagement" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} animationBegin={200} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No post type performance data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Topic Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {contentTopicPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={contentTopicPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="topic" tick={axisTick} angle={-30} textAnchor="end" height={60} label={{ value: "Topic", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={axisTick} label={{ value: "Value", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="avgEngagement" name="Engagement" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} animationBegin={200} animationDuration={800} />
                        <Bar dataKey="donationReferrals" name="Referrals" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} animationBegin={400} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No content topic data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Donation Referral Attribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  {donationAttribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={donationAttribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          dataKey="estimatedValue"
                          nameKey="platform"
                          label={({ name, percent }: any) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          animationBegin={200}
                          animationDuration={1000}
                        >
                          {donationAttribution.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Est. Value"]} contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No donation attribution data available" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {!recsLoading && recommendations && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                ML-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Best Time to Post</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">
                      {recommendations.best_post_time?.day ?? "—"} at {recommendations.best_post_time?.hour ?? 0}:00
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Recommended Content</p>
                  <Badge variant="secondary">{recommendations.recommended_content_type}</Badge>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Predicted Engagement</p>
                  <span className="text-sm font-semibold">
                    {((recommendations.predicted_engagement_rate ?? 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Campaign Insights</p>
                  <ul className="space-y-1">
                    {(recommendations.campaign_insights ?? []).slice(0, 3).map((insight, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────
// Main Reports Page
// ──────────────────────────────────────────────────
export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Aggregated insights and trends to support decision-making across all Pharos operations."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports & Analytics" },
        ]}
      />

      <Tabs defaultValue="donations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="donations">Donation Trends</TabsTrigger>
          <TabsTrigger value="outcomes">Resident Outcomes</TabsTrigger>
          <TabsTrigger value="safehouses">Safehouse Comparisons</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="donations">
          <DonationTrendsTab />
        </TabsContent>

        <TabsContent value="outcomes">
          <ResidentOutcomesTab />
        </TabsContent>

        <TabsContent value="safehouses">
          <SafehouseComparisonsTab />
        </TabsContent>

        <TabsContent value="social">
          <SocialMediaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
