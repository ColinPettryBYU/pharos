import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { EmotionalStateIndicator } from "@/components/shared/EmotionalStateIndicator";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  mockResidents,
  mockProcessRecordings,
  mockHomeVisitations,
  mockEducationRecords,
  mockHealthRecords,
  mockInterventionPlans,
  mockIncidentReports,
} from "@/lib/mock-data";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ClipboardList, Calendar, User, MapPin, GraduationCap,
  AlertTriangle, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ComponentPropsWithoutRef } from "react";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ResidentDetailPage() {
  const { id } = useParams();
  const resident = mockResidents.find((r) => r.resident_id === Number(id));
  if (!resident) return <div className="p-8 text-center text-muted-foreground">Resident not found.</div>;

  const recordings = mockProcessRecordings.filter((r) => r.resident_id === resident.resident_id);
  const visitations = mockHomeVisitations.filter((v) => v.resident_id === resident.resident_id);
  const eduRecords = mockEducationRecords.filter((e) => e.resident_id === resident.resident_id);
  const healthRecords = mockHealthRecords.filter((h) => h.resident_id === resident.resident_id);
  const plans = mockInterventionPlans.filter((p) => p.resident_id === resident.resident_id);
  const incidents = mockIncidentReports.filter((i) => i.resident_id === resident.resident_id);

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
    date: format(new Date(h.record_date), "MMM"),
    health: +h.general_health_score.toFixed(1),
    nutrition: +h.nutrition_score.toFixed(1),
    sleep: +h.sleep_quality_score.toFixed(1),
    energy: +h.energy_level_score.toFixed(1),
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
          <Dialog>
            <DialogTrigger
              render={<Button className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Case Conference Prep
              </Button>}
            />
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Case Conference Summary — {resident.case_control_no}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 text-sm">
                <section>
                  <h3 className="font-semibold mb-2">Resident Overview</h3>
                  <p>Age: {resident.present_age} | Safehouse: {resident.safehouse?.name} | Risk: {resident.current_risk_level} | Stay: {resident.length_of_stay} months</p>
                </section>
                <section>
                  <h3 className="font-semibold mb-2">Latest Sessions ({recordings.length} total)</h3>
                  {recordings.slice(0, 3).map((r) => (
                    <div key={r.recording_id} className="border-l-2 border-primary pl-3 mb-2">
                      <p className="text-xs text-muted-foreground">{format(new Date(r.session_date), "MMM d, yyyy")} - {r.social_worker}</p>
                      <p>{r.emotional_state_observed} → {r.emotional_state_end}</p>
                      {r.concerns_flagged && <Badge variant="destructive" className="text-xs mt-1">Concern Flagged</Badge>}
                    </div>
                  ))}
                </section>
                <section>
                  <h3 className="font-semibold mb-2">Active Intervention Plans</h3>
                  {plans.filter((p) => p.status !== "Closed").map((p) => (
                    <div key={p.plan_id} className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{p.plan_category}</Badge>
                      <span>{p.plan_description}</span>
                      <Badge variant="secondary">{p.status}</Badge>
                    </div>
                  ))}
                </section>
                <section>
                  <h3 className="font-semibold mb-2">Recent Incidents</h3>
                  {incidents.length === 0 ? <p className="text-muted-foreground">No recent incidents.</p> : incidents.slice(0, 3).map((i) => (
                    <div key={i.incident_id} className="mb-1">
                      <Badge variant={i.severity === "High" ? "destructive" : "outline"}>{i.severity}</Badge>
                      <span className="ml-2">{i.incident_type} — {format(new Date(i.incident_date), "MMM d, yyyy")}</span>
                    </div>
                  ))}
                </section>
                <section>
                  <h3 className="font-semibold mb-2">ML Readiness Score</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-primary">{resident.readiness_score ?? 0}%</div>
                    <p className="text-muted-foreground">Reintegration readiness based on education, health, and counseling progress.</p>
                  </div>
                </section>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Header Card */}
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="visitations">Home Visits</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth</span><span>{format(new Date(resident.date_of_birth), "MMM d, yyyy")}</span></div>
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
                <div className="flex justify-between"><span className="text-muted-foreground">Admission</span><span>{format(new Date(resident.date_of_admission), "MMM d, yyyy")}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Family Profile</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  ["4Ps Member", resident.family_is_4ps],
                  ["Solo Parent", resident.family_solo_parent],
                  ["Indigenous", resident.family_indigenous],
                  ["Parent PWD", resident.family_parent_pwd],
                  ["Informal Settler", resident.family_informal_settler],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-muted-foreground">{label as string}</span>
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

        {/* Process Recordings Tab */}
        <TabsContent value="recordings">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {recordings.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No recordings found.</CardContent></Card>
            ) : (
              recordings.map((rec) => (
                <motion.div key={rec.recording_id} variants={item}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-sm font-medium tabular-nums">{format(new Date(rec.session_date), "MMM d, yyyy")}</span>
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
              ))
            )}
          </motion.div>
        </TabsContent>

        {/* Home Visitations Tab */}
        <TabsContent value="visitations">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {visitations.map((visit) => (
              <motion.div key={visit.visitation_id} variants={item}>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-sm font-medium tabular-nums">{format(new Date(visit.visit_date), "MMM d, yyyy")}</span>
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

        {/* Education Tab */}
        <TabsContent value="education">
          <div className="space-y-6">
            {eduRecords.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Education Progress</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={eduRecords.map((e) => ({ date: format(new Date(e.record_date), "MMM"), progress: e.progress_percent, attendance: e.attendance_rate }))}>
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
              {eduRecords.map((e) => (
                <motion.div key={e.education_record_id} variants={item}>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{e.education_level}</span>
                          <Badge variant="outline" className="text-xs">{e.completion_status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{e.school_name} | Attendance: {e.attendance_rate}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums">{e.progress_percent}%</p>
                        <p className="text-xs text-muted-foreground">Progress</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <div className="space-y-6">
            {healthChartData.length > 0 && (
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
            )}
          </div>
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {(["Safety", "Psychosocial", "Education", "Physical Health", "Legal", "Reintegration"] as const).map((cat) => {
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
                        <p className="text-xs text-muted-foreground">Target: {format(new Date(p.target_date), "MMM d, yyyy")} | Services: {p.services_provided}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {incidents.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No incidents reported.</CardContent></Card>
            ) : (
              incidents.map((inc) => {
                const severityColors = { Low: "border-l-yellow-500", Medium: "border-l-orange-500", High: "border-l-red-500" };
                return (
                  <motion.div key={inc.incident_id} variants={item}>
                    <Card className={cn("border-l-4", severityColors[inc.severity])}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={cn("h-4 w-4", inc.severity === "High" ? "text-destructive" : "text-warning")} />
                          <Badge variant="outline">{inc.incident_type}</Badge>
                          <Badge variant={inc.severity === "High" ? "destructive" : "secondary"}>{inc.severity}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">{format(new Date(inc.incident_date), "MMM d, yyyy")}</span>
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
              })
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
