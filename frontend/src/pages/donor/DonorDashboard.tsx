import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { DataTableWrapper } from "@/components/shared/DataTableWrapper";
import { useAuth } from "@/lib/auth";
import { useDonorProfile, useDonorDonations, useDonorImpact } from "@/hooks/useDonorPortal";
import { formatCurrency } from "@/lib/api";
import type { ColumnDef } from "@tanstack/react-table";
import type { Donation } from "@/types";
import { fmtDate } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
} from "recharts";
import { Heart, DollarSign, Calendar, Gift } from "lucide-react";

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

const donationCols: ColumnDef<Donation>[] = [
  { accessorKey: "donation_date", header: "Date", cell: ({ row }) => fmtDate(row.getValue("donation_date")) },
  { accessorKey: "donation_type", header: "Type", cell: ({ row }) => <Badge variant="outline">{row.getValue("donation_type")}</Badge> },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.getValue("amount"))}</span> },
  { accessorKey: "campaign_name", header: "Campaign", cell: ({ row }) => row.getValue("campaign_name") || <span className="text-muted-foreground">-</span> },
];

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DonorDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useDonorProfile();
  const { data: donationsData, isLoading: donationsLoading } = useDonorDonations();
  const { data: impact, isLoading: impactLoading } = useDonorImpact();

  const donations: any[] = Array.isArray(donationsData) ? donationsData : (donationsData as any)?.data ?? [];
  const totalDonated = impact?.totalDonated ?? donations.reduce((s, d) => s + d.amount, 0);
  const isLoading = profileLoading || donationsLoading || impactLoading;

  const allocationByArea = (impact?.allocations ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.program_area] = (acc[a.program_area] || 0) + a.amount_allocated;
    return acc;
  }, {});
  const pieData = Object.entries(allocationByArea).map(([name, value]) => ({ name, value: Math.round(value) }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Thank you, {user?.display_name || profile?.display_name || "Valued Supporter"}.
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">Here's the impact of your generosity.</p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <motion.div variants={item}><StatCard title="Total Donated" value={totalDonated} format="currency" icon={DollarSign} /></motion.div>
          <motion.div variants={item}><StatCard title="Donations" value={impact?.donationsCount ?? donations.length} icon={Heart} /></motion.div>
          <motion.div variants={item}><StatCard title="Safehouses Reached" value={impact?.safehousesReached ?? 0} icon={Calendar} /></motion.div>
        </motion.div>
      )}

      {pieData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <Card>
            <CardHeader><CardTitle className="text-lg">Where Your Money Went</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Allocated"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Heart className="mx-auto h-10 w-10 text-primary mb-3" />
            <h3 className="text-xl font-semibold mb-2">Your Impact</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your contributions have supported {impact?.safehousesReached ?? 0} safehouses,
              helping provide education, healthcare, and counseling services to girls across the Philippines.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Donation History</h2>
        <DataTableWrapper columns={donationCols} data={donations} isLoading={donationsLoading} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="text-center">
          <CardContent className="p-8">
            <Gift className="mx-auto h-10 w-10 text-primary mb-3" />
            <h3 className="text-xl font-semibold">Continue Making a Difference</h3>
            <p className="text-muted-foreground mt-1 mb-4">Every donation goes directly to supporting girls in our safehouses.</p>
            <a href="https://www.lighthousesanctuary.org/donate" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <Heart className="h-4 w-4" />Give Again
              </Button>
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
