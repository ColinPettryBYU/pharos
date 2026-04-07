import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDashboard } from "@/hooks/useDashboard";
import { useDonationReports } from "@/hooks/useReports";
import { useSafehouses } from "@/hooks/useSafehouses";
import { formatCurrency } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Share2,
  UserPlus,
  FileText,
  Heart,
  PenSquare,
  Gift,
  Siren,
  Megaphone,
  Home,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const activityIcons: Record<string, React.ElementType> = {
  donation: Gift,
  recording: FileText,
  incident: Siren,
  social: Megaphone,
  visitation: Home,
};

export default function AdminDashboard() {
  const { data: dashboard, isLoading, error, refetch } = useDashboard();
  const { data: donationReport } = useDonationReports();
  const { data: safehouses } = useSafehouses();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Failed to load dashboard data</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const activityFeed = dashboard?.activityFeed ?? [];
  const riskAlerts = dashboard?.riskAlerts ?? [];

  const chartData = (donationReport?.trends ?? []).map((d) => ({
    month: format(new Date(d.month + "-01"), "MMM"),
    total: d.total,
  }));

  const occupancyData = (safehouses ?? []).map((s) => ({
    name: s.safehouse_code,
    occupancy: s.current_occupancy,
    capacity: s.capacity_girls,
    percent: Math.round((s.current_occupancy / s.capacity_girls) * 100),
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's an overview of Pharos operations."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <motion.div variants={item}>
            <StatCard
              title="Active Residents"
              value={stats?.activeResidents ?? 0}
              icon={Users}
              trend={stats?.activeResidentsTrend ? { value: stats.activeResidentsTrend, direction: stats.activeResidentsTrend >= 0 ? "up" : "down" } : undefined}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title="Monthly Donations"
              value={stats?.monthlyDonations ?? 0}
              format="currency"
              icon={DollarSign}
              trend={stats?.monthlyDonationsTrend ? { value: stats.monthlyDonationsTrend, direction: "up" } : undefined}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title="Cases Needing Review"
              value={stats?.casesNeedingReview ?? 0}
              icon={AlertTriangle}
              trend={stats?.casesNeedingReviewTrend ? { value: Math.abs(stats.casesNeedingReviewTrend), direction: stats.casesNeedingReviewTrend < 0 ? "down" : "up" } : undefined}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              title="Social Engagement"
              value={stats?.socialEngagement ?? 0}
              format="percent"
              icon={Share2}
              trend={stats?.socialEngagementTrend ? { value: stats.socialEngagementTrend, direction: "up" } : undefined}
            />
          </motion.div>
        </motion.div>
      )}

      <Tabs defaultValue="donations" className="mb-8">
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="safehouses">Safehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Donation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--color-primary)" fill="url(#colorDonations)" strokeWidth={2} animationBegin={200} animationDuration={1000} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">No donation data yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safehouses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Safehouse Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              {occupancyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={occupancyData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={60} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="capacity" fill="var(--color-muted)" radius={[0, 4, 4, 0]} animationBegin={200} animationDuration={800} />
                    <Bar dataKey="occupancy" fill="var(--color-primary)" radius={[0, 4, 4, 0]} animationBegin={400} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">No safehouse data yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                  {activityFeed.map((activity) => {
                    const Icon = activityIcons[activity.type] || FileText;
                    return (
                      <motion.div key={activity.id} variants={item} className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-muted p-2 shrink-0">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Risk Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {riskAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No active risk alerts</p>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                  {riskAlerts.map((alert) => (
                    <motion.div key={alert.id} variants={item}>
                      <Link to={alert.link}>
                        <motion.div whileHover={{ scale: 1.01 }} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{alert.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {alert.type === "resident" ? "Resident" : "Donor"}
                              </Badge>
                              <RiskBadge level={alert.riskLevel} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{alert.recommendedAction}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold tabular-nums">{alert.riskScore}</p>
                            <p className="text-xs text-muted-foreground">risk score</p>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/residents"><Button variant="outline" className="gap-2"><UserPlus className="h-4 w-4" />New Resident</Button></Link>
              <Link to="/admin/process-recordings"><Button variant="outline" className="gap-2"><FileText className="h-4 w-4" />Record Session</Button></Link>
              <Link to="/admin/donations"><Button variant="outline" className="gap-2"><Heart className="h-4 w-4" />Log Donation</Button></Link>
              <Link to="/admin/social"><Button variant="outline" className="gap-2"><PenSquare className="h-4 w-4" />Compose Post</Button></Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
