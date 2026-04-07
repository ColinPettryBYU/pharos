import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { useSupporter } from "@/hooks/useSupporters";
import { useDonations, useDonationAllocations } from "@/hooks/useDonations";
import { formatCurrency } from "@/lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { Donation, RiskLevel } from "@/types";
import { fmtDate } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Mail, Phone, Globe, Calendar, DollarSign, TrendingUp, Heart, AlertTriangle } from "lucide-react";

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

const donationCols: ColumnDef<Donation>[] = [
  { accessorKey: "donation_date", header: "Date", cell: ({ row }) => fmtDate(row.getValue("donation_date")) },
  { accessorKey: "donation_type", header: "Type", cell: ({ row }) => <Badge variant="outline">{row.getValue("donation_type")}</Badge> },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.getValue("amount"))}</span> },
  { accessorKey: "campaign_name", header: "Campaign", cell: ({ row }) => row.getValue("campaign_name") || <span className="text-muted-foreground">-</span> },
  { accessorKey: "channel_source", header: "Channel" },
];

export default function DonorDetailPage() {
  const { id } = useParams();
  const numId = Number(id);
  const { data: supporter, isLoading, error, refetch } = useSupporter(numId);
  const { data: donationsData } = useDonations({ supporterId: numId });
  const { data: allocationsData } = useDonationAllocations({ donorId: numId });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (error || !supporter) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Supporter not found</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const donations: Donation[] = Array.isArray(donationsData) ? donationsData : (donationsData?.data ?? []);
  const allocations = Array.isArray(allocationsData) ? allocationsData : (allocationsData?.data ?? []);
  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

  const allocationByProgram = allocations.reduce<Record<string, number>>((acc, a) => {
    acc[a.program_area] = (acc[a.program_area] || 0) + a.amount_allocated;
    return acc;
  }, {});
  const pieData = Object.entries(allocationByProgram).map(([name, value]) => ({ name, value: Math.round(value) }));

  const donationTimeline = donations.map((d) => ({
    date: fmtDate(d.donation_date, "MMM yy"),
    amount: d.amount,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const churnLevel: RiskLevel = (supporter.churn_risk ?? 0) < 25 ? "Low" : (supporter.churn_risk ?? 0) < 50 ? "Medium" : (supporter.churn_risk ?? 0) < 75 ? "High" : "Critical";

  return (
    <div>
      <PageHeader
        title={supporter.display_name}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Supporters", href: "/admin/donors" },
          { label: supporter.display_name },
        ]}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold">
                {supporter.first_name?.[0]}{supporter.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">{supporter.display_name}</h2>
                  <Badge variant="outline">{supporter.supporter_type}</Badge>
                  <Badge variant={supporter.status === "Active" ? "default" : "secondary"}>{supporter.status}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{supporter.email}</span>
                  {supporter.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{supporter.phone}</span>}
                  <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{supporter.country}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Since {fmtDate(supporter.first_donation_date, "MMM yyyy", "N/A")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="donations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="ml">ML Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Total Donated" value={totalDonated} format="currency" icon={DollarSign} />
            <StatCard title="Donations Count" value={donations.length} icon={Heart} />
            <StatCard title="Avg Donation" value={donations.length > 0 ? totalDonated / donations.length : 0} format="currency" icon={TrendingUp} />
          </div>
          {donationTimeline.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Donation History</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={donationTimeline}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Amount"]} contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="amount" stroke="var(--color-primary)" fill="url(#colorAmt)" strokeWidth={2} animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          <DataTableWrapper columns={donationCols} data={donations} searchKey="campaign_name" searchPlaceholder="Search by campaign..." />
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardHeader><CardTitle className="text-lg">Donation Allocation by Program Area</CardTitle></CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} animationDuration={1000}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Allocated"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No allocation data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact">
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your Impact</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Generous contributions of {formatCurrency(totalDonated)} have directly supported safehouses across the Philippines.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="rounded-xl bg-muted/50 p-6">
                  <p className="text-3xl font-bold text-primary tabular-nums">{allocations.length}</p>
                  <p className="text-sm text-muted-foreground">Programs Supported</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-6">
                  <p className="text-3xl font-bold text-primary tabular-nums">{new Set(allocations.map((a) => a.safehouse_id)).size}</p>
                  <p className="text-sm text-muted-foreground">Safehouses Reached</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-6">
                  <p className="text-3xl font-bold text-primary tabular-nums">{donations.filter((d) => d.is_recurring).length}</p>
                  <p className="text-sm text-muted-foreground">Recurring Donations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <AlertTriangle className="h-8 w-8 text-warning" />
                <div>
                  <h3 className="text-lg font-semibold">Churn Risk Assessment</h3>
                  <p className="text-sm text-muted-foreground">ML-powered prediction of donor retention likelihood</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-bold tabular-nums">{supporter.churn_risk ?? 0}%</p>
                  <RiskBadge level={churnLevel} />
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Key Factors</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>Donation frequency: {donations.length > 5 ? "Regular" : "Infrequent"}</li>
                  <li>Last donation: {donations.length > 0 ? fmtDate(donations[donations.length - 1].donation_date, "MMM d, yyyy", "N/A") : "N/A"}</li>
                  <li>Campaign engagement: {donations.filter((d) => d.campaign_name).length} campaign donations</li>
                  <li>Recurring status: {donations.some((d) => d.is_recurring) ? "Has recurring" : "No recurring"}</li>
                </ul>
                <h4 className="text-sm font-semibold mt-4">Recommended Actions</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>Send personalized impact report showing donation outcomes</li>
                  <li>Invite to upcoming campaign or event</li>
                  {(supporter.churn_risk ?? 0) > 50 && <li>Schedule personal outreach call</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
