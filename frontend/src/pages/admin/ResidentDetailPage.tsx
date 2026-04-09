import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { EmotionalStateIndicator } from "@/components/shared/EmotionalStateIndicator";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useResident, useResidentRecordings, useResidentVisitations,
  useResidentEducation, useResidentHealth, useResidentInterventions,
  useResidentIncidents, useUpdateResident, useResidentRisk,
} from "@/hooks/useResidents";
import { fmtDate } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { User, MapPin, Calendar, GraduationCap, AlertTriangle, Target, Pencil, ShieldAlert, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const editResidentSchema = z.object({
  CaseStatus: z.string().min(1, "Required"),
  CaseCategory: z.string().min(1, "Required"),
  CurrentRiskLevel: z.string().min(1, "Required"),
  ReintegrationType: z.string().min(1, "Required"),
  ReintegrationStatus: z.string().min(1, "Required"),
  AssignedSocialWorker: z.string().min(1, "Required"),
  NotesRestricted: z.string().optional(),
});
type EditResidentValues = z.infer<typeof editResidentSchema>;

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const VALID_TABS = ["overview", "recordings", "visitations", "education", "health", "interventions", "incidents"] as const;

export default function ResidentDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const numId = Number(id);
  const { data: resident, isLoading, error, refetch } = useResident(numId);
  const { data: recordings } = useResidentRecordings(numId);
  const { data: visitations } = useResidentVisitations(numId);
  const { data: eduRecordsRaw } = useResidentEducation(numId);
  const { data: healthRecordsRaw } = useResidentHealth(numId);
  const { data: plansRaw } = useResidentInterventions(numId);
  const { data: incidentsRaw } = useResidentIncidents(numId);

  const { data: riskPrediction } = useResidentRisk(numId);
  const updateResident = useUpdateResident();
  const [editOpen, setEditOpen] = useState(false);

  const tabFromUrl = searchParams.get("tab") ?? "overview";
  const activeTab = VALID_TABS.includes(tabFromUrl as typeof VALID_TABS[number]) ? tabFromUrl : "overview";

  const form = useForm<EditResidentValues>({
    resolver: zodResolver(editResidentSchema),
    defaultValues: {
      CaseStatus: "",
      CaseCategory: "",
      CurrentRiskLevel: "",
      ReintegrationType: "",
      ReintegrationStatus: "",
      AssignedSocialWorker: "",
      NotesRestricted: "",
    },
  });

  useEffect(() => {
    if (editOpen && resident) {
      form.reset({
        CaseStatus: resident.case_status ?? "",
        CaseCategory: resident.case_category ?? "",
        CurrentRiskLevel: resident.current_risk_level ?? "",
        ReintegrationType: resident.reintegration_type ?? "",
        ReintegrationStatus: resident.reintegration_status ?? "",
        AssignedSocialWorker: resident.assigned_social_worker ?? "",
        NotesRestricted: resident.notes_restricted ?? "",
      });
    }
  }, [editOpen, resident, form]);

  const onEditSubmit = form.handleSubmit(async (values) => {
    try {
      await updateResident.mutateAsync({ id: numId, data: values });
      toast.success("Resident updated successfully");
      setEditOpen(false);
      refetch();
    } catch {
      toast.error("Failed to update resident");
    }
  });

  const eduRecords: any[] = Array.isArray(eduRecordsRaw) ? eduRecordsRaw : (eduRecordsRaw as any)?.data ?? [];
  const healthRecords: any[] = Array.isArray(healthRecordsRaw) ? healthRecordsRaw : (healthRecordsRaw as any)?.data ?? [];
  const plans: any[] = Array.isArray(plansRaw) ? plansRaw : (plansRaw as any)?.data ?? [];
  const incidents: any[] = Array.isArray(incidentsRaw) ? incidentsRaw : (incidentsRaw as any)?.data ?? [];
  const recordingsList: any[] = Array.isArray(recordings) ? recordings : (recordings as any)?.data ?? [];
  const visitationsList: any[] = Array.isArray(visitations) ? visitations : (visitations as any)?.data ?? [];

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (error || !resident) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Resident not found</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  const subCategories = [
    resident.sub_cat_orphaned && "Orphaned",
    resident.sub_cat_trafficked && "Trafficked",
    resident.sub_cat_child_labor && "Child Labor",
    resident.sub_cat_physical_abuse && "Physical Abuse",
    resident.sub_cat_sexual_abuse && "Sexual Abuse",
    resident.sub_cat_osaec && "OSAEC",
    resident.sub_cat_at_risk && "At Risk",
  ].filter(Boolean);

  const healthChartData = healthRecords.map((h) => ({
    date: fmtDate(h.record_date, "MMM"),
    health: +(h.general_health_score ?? 0).toFixed(1),
    nutrition: +(h.nutrition_score ?? 0).toFixed(1),
    sleep: +(h.sleep_quality_score ?? 0).toFixed(1),
    energy: +(h.energy_level_score ?? 0).toFixed(1),
  }));

  return (
    <div>
      <PageHeader
        title={`Case ${resident.case_control_no}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Caseload", href: "/admin/residents" },
          { label: resident.case_control_no },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Resident
          </Button>
        }
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">{resident.internal_code}</h2>
                  <RiskBadge level={resident.current_risk_level} />
                  <Badge variant={resident.case_status === "Active" ? "default" : "secondary"}>{resident.case_status}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{resident.safehouse?.name}</span>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{resident.assigned_social_worker}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Age {resident.present_age} | {resident.length_of_stay} mo stay</span>
                </div>
              </div>
              {resident.readiness_score !== undefined && (
                <div className="text-center shrink-0">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <svg className="h-20 w-20 -rotate-90">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-muted)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeDasharray={`${(resident.readiness_score / 100) * 213.6} 213.6`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-lg font-bold">{resident.readiness_score}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Readiness</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {riskPrediction && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={cn(
            "mb-6 border-l-4",
            riskPrediction.risk_score >= 0.6 ? "border-l-destructive" :
            riskPrediction.risk_score >= 0.35 ? "border-l-warning" : "border-l-success"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  riskPrediction.risk_score >= 0.6 ? "bg-destructive/10 text-destructive" :
                  riskPrediction.risk_score >= 0.35 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                )}>
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Elevated Risk Score</span>
                    <Badge variant={
                      riskPrediction.risk_score >= 0.6 ? "destructive" :
                      riskPrediction.risk_score >= 0.35 ? "outline" : "secondary"
                    }>
                      {riskPrediction.risk_level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono text-base font-bold text-foreground">
                      {(riskPrediction.risk_score * 100).toFixed(0)}%
                    </span>
                    {riskPrediction.top_factors?.length > 0 && (
                      <span className="flex items-center gap-1">
                        {riskPrediction.top_factors[0].direction === "increases_risk"
                          ? <TrendingUp className="h-3 w-3 text-destructive" />
                          : <TrendingDown className="h-3 w-3 text-success" />}
                        {riskPrediction.top_factors[0].feature.replace(/_/g, " ")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated {fmtDate(riskPrediction.last_updated)}
                    </span>
                  </div>
                </div>
                {riskPrediction.top_factors?.length > 1 && (
                  <div className="hidden md:flex gap-2">
                    {riskPrediction.top_factors.slice(1, 3).map((f, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {f.direction === "increases_risk"
                          ? <TrendingUp className="h-3 w-3 mr-1 text-destructive" />
                          : <TrendingDown className="h-3 w-3 mr-1 text-success" />}
                        {f.feature.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="visitations">Home Visits</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth</span><span>{fmtDate(resident.date_of_birth)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Place of Birth</span><span>{resident.place_of_birth}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Religion</span><span>{resident.religion}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Birth Status</span><span>{resident.birth_status}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Case Information</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{resident.case_category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sub-categories</span><div className="flex gap-1 flex-wrap justify-end">{subCategories.map((s) => <Badge key={s as string} variant="outline" className="text-xs">{s as string}</Badge>)}</div></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Referral Source</span><span>{resident.referral_source}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Admission</span><span>{fmtDate(resident.date_of_admission)}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Family Profile</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {([
                  ["4Ps Member", resident.family_is_4ps], ["Solo Parent", resident.family_solo_parent],
                  ["Indigenous", resident.family_indigenous], ["Parent PWD", resident.family_parent_pwd],
                  ["Informal Settler", resident.family_informal_settler],
                ] as const).map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <Badge variant={val ? "default" : "secondary"} className="text-xs">{val ? "Yes" : "No"}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Reintegration</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{resident.reintegration_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline">{resident.reintegration_status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Initial Risk</span><RiskBadge level={resident.initial_risk_level} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Current Risk</span><RiskBadge level={resident.current_risk_level} /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recordings">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {recordingsList.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No recordings found.</CardContent></Card>
            ) : recordingsList.map((rec) => (
              <motion.div key={rec.recording_id} variants={item}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-sm font-medium tabular-nums">{fmtDate(rec.session_date)}</span>
                      <Badge variant="outline">{rec.session_type}</Badge>
                      <span className="text-xs text-muted-foreground">{rec.session_duration_minutes} min</span>
                      <span className="text-xs text-muted-foreground">| {rec.social_worker}</span>
                      <EmotionalStateIndicator start={rec.emotional_state_observed} end={rec.emotional_state_end} />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{rec.session_narrative}</p>
                    <div className="flex gap-2 mt-3">
                      {rec.progress_noted && <Badge className="bg-success/10 text-success border-0 text-xs">Progress</Badge>}
                      {rec.concerns_flagged && <Badge variant="destructive" className="text-xs">Concern</Badge>}
                      {rec.referral_made && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0 text-xs">Referral</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="visitations">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {visitationsList.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No home visits found.</CardContent></Card>
            ) : visitationsList.map((visit) => (
              <motion.div key={visit.visitation_id} variants={item}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-sm font-medium tabular-nums">{fmtDate(visit.visit_date)}</span>
                      <Badge variant="outline">{visit.visit_type}</Badge>
                      <Badge variant={visit.visit_outcome === "Favorable" ? "default" : "secondary"}>{visit.visit_outcome}</Badge>
                      {visit.safety_concerns_noted && <Badge variant="destructive" className="text-xs">Safety Concern</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{visit.observations}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>Cooperation: {visit.family_cooperation_level}</span>
                      <span>| {visit.social_worker}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="education">
          <div className="space-y-6">
            {eduRecords.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Education Progress</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={eduRecords.map((e) => ({ date: fmtDate(e.record_date, "MMM"), progress: e.progress_percent, attendance: e.attendance_rate }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="progress" stroke="var(--color-primary)" strokeWidth={2} name="Progress %" animationDuration={1000} />
                      <Line type="monotone" dataKey="attendance" stroke="var(--color-success)" strokeWidth={2} name="Attendance %" animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {eduRecords.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No education records found.</CardContent></Card>
              ) : eduRecords.map((e) => (
                <motion.div key={e.education_record_id} variants={item}>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><span className="font-medium text-sm">{e.education_level}</span><Badge variant="outline" className="text-xs">{e.completion_status}</Badge></div>
                        <p className="text-xs text-muted-foreground">{e.school_name} | Attendance: {e.attendance_rate}%</p>
                      </div>
                      <div className="text-right"><p className="text-lg font-bold tabular-nums">{e.progress_percent}%</p><p className="text-xs text-muted-foreground">Progress</p></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="health">
          {healthChartData.length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-lg">Health Score Trends</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={healthChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis domain={[1, 5]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="health" stroke="var(--color-chart-1)" strokeWidth={2} name="General Health" animationDuration={1000} />
                    <Line type="monotone" dataKey="nutrition" stroke="var(--color-chart-2)" strokeWidth={2} name="Nutrition" animationDuration={1000} />
                    <Line type="monotone" dataKey="sleep" stroke="var(--color-chart-3)" strokeWidth={2} name="Sleep Quality" animationDuration={1000} />
                    <Line type="monotone" dataKey="energy" stroke="var(--color-chart-5)" strokeWidth={2} name="Energy Level" animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No health records found.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="interventions">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {plans.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No intervention plans found.</CardContent></Card>
            ) : (["Safety", "Psychosocial", "Education", "Physical Health", "Legal", "Reintegration"] as const).map((cat) => {
              const catPlans = plans.filter((p) => p.plan_category === cat);
              if (catPlans.length === 0) return null;
              return (
                <motion.div key={cat} variants={item}>
                  <h3 className="text-sm font-semibold mb-2">{cat}</h3>
                  {catPlans.map((p) => (
                    <Card key={p.plan_id} className="mb-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{p.plan_description}</span>
                          <Badge variant="outline" className="text-xs ml-auto">{p.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Target: {fmtDate(p.target_date)} | Services: {p.services_provided}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        <TabsContent value="incidents">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {incidents.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No incidents reported.</CardContent></Card>
            ) : incidents.map((inc) => {
              const severityColors: Record<string, string> = { Low: "border-l-yellow-500", Medium: "border-l-orange-500", High: "border-l-red-500" };
              return (
                <motion.div key={inc.incident_id} variants={item}>
                  <Card className={cn("border-l-4", severityColors[inc.severity] ?? "")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={cn("h-4 w-4", inc.severity === "High" ? "text-destructive" : "text-warning")} />
                        <Badge variant="outline">{inc.incident_type}</Badge>
                        <Badge variant={inc.severity === "High" ? "destructive" : "secondary"}>{inc.severity}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{fmtDate(inc.incident_date)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{inc.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={inc.resolved ? "default" : "destructive"} className="text-xs">{inc.resolved ? "Resolved" : "Unresolved"}</Badge>
                        <span className="text-xs text-muted-foreground">Reported by: {inc.reported_by}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Resident</SheetTitle>
          </SheetHeader>
          <form onSubmit={onEditSubmit} className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="CaseStatus">Case Status</Label>
              <Select
                value={form.watch("CaseStatus") ?? ""}
                onValueChange={(v) => form.setValue("CaseStatus", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger id="CaseStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Active", "Closed", "Transferred"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="CaseCategory">Case Category</Label>
              <Select
                value={form.watch("CaseCategory") ?? ""}
                onValueChange={(v) => form.setValue("CaseCategory", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger id="CaseCategory"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Abandoned", "Foundling", "Surrendered", "Neglected"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="CurrentRiskLevel">Current Risk Level</Label>
              <Select
                value={form.watch("CurrentRiskLevel") ?? ""}
                onValueChange={(v) => form.setValue("CurrentRiskLevel", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger id="CurrentRiskLevel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Critical"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ReintegrationType">Reintegration Type</Label>
              <Select
                value={form.watch("ReintegrationType") ?? ""}
                onValueChange={(v) => form.setValue("ReintegrationType", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger id="ReintegrationType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Family Reunification", "Foster Care", "Adoption (Domestic)", "Adoption (Inter-Country)", "Independent Living", "None"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ReintegrationStatus">Reintegration Status</Label>
              <Select
                value={form.watch("ReintegrationStatus") ?? ""}
                onValueChange={(v) => form.setValue("ReintegrationStatus", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger id="ReintegrationStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Not Started", "In Progress", "Completed", "On Hold"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="AssignedSocialWorker">Assigned Social Worker</Label>
              <Input
                id="AssignedSocialWorker"
                {...form.register("AssignedSocialWorker")}
              />
              {form.formState.errors.AssignedSocialWorker && (
                <p className="text-sm text-destructive">{form.formState.errors.AssignedSocialWorker.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="NotesRestricted">Notes</Label>
              <textarea
                id="NotesRestricted"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("NotesRestricted")}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateResident.isPending}>
                {updateResident.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
