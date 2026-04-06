import type {
  Supporter,
  Donation,
  Resident,
  ProcessRecording,
  HomeVisitation,
  EducationRecord,
  HealthRecord,
  InterventionPlan,
  IncidentReport,
  SocialMediaPost,
  Safehouse,
  Partner,
  SafehouseMonthlyMetric,
  PublicImpactSnapshot,
  DashboardStats,
  ActivityFeedItem,
  RiskAlert,
  DonationTrend,
  DonationAllocation,
  SocialMediaComment,
} from "@/types";

// --- Safehouses ---
export const mockSafehouses: Safehouse[] = [
  { safehouse_id: 1, safehouse_code: "LUZ-001", name: "Bahay Pag-asa Luzon", region: "Luzon", city: "Quezon City", province: "Metro Manila", country: "Philippines", open_date: "2019-03-15", status: "Active", capacity_girls: 15, capacity_staff: 8, current_occupancy: 12, notes: "Main safehouse" },
  { safehouse_id: 2, safehouse_code: "LUZ-002", name: "Haven of Light Manila", region: "Luzon", city: "Manila", province: "Metro Manila", country: "Philippines", open_date: "2019-06-01", status: "Active", capacity_girls: 12, capacity_staff: 6, current_occupancy: 10 },
  { safehouse_id: 3, safehouse_code: "VIS-001", name: "Lighthouse Cebu", region: "Visayas", city: "Cebu City", province: "Cebu", country: "Philippines", open_date: "2020-01-10", status: "Active", capacity_girls: 10, capacity_staff: 5, current_occupancy: 8 },
  { safehouse_id: 4, safehouse_code: "VIS-002", name: "Safe Harbor Iloilo", region: "Visayas", city: "Iloilo City", province: "Iloilo", country: "Philippines", open_date: "2020-08-20", status: "Active", capacity_girls: 8, capacity_staff: 4, current_occupancy: 6 },
  { safehouse_id: 5, safehouse_code: "MIN-001", name: "Beacon House Davao", region: "Mindanao", city: "Davao City", province: "Davao del Sur", country: "Philippines", open_date: "2021-02-14", status: "Active", capacity_girls: 10, capacity_staff: 5, current_occupancy: 7 },
  { safehouse_id: 6, safehouse_code: "MIN-002", name: "Sunrise Center CDO", region: "Mindanao", city: "Cagayan de Oro", province: "Misamis Oriental", country: "Philippines", open_date: "2021-07-01", status: "Active", capacity_girls: 8, capacity_staff: 4, current_occupancy: 5 },
  { safehouse_id: 7, safehouse_code: "LUZ-003", name: "Pag-asa Baguio", region: "Luzon", city: "Baguio City", province: "Benguet", country: "Philippines", open_date: "2022-03-01", status: "Active", capacity_girls: 6, capacity_staff: 3, current_occupancy: 4 },
  { safehouse_id: 8, safehouse_code: "VIS-003", name: "Hope Center Bacolod", region: "Visayas", city: "Bacolod City", province: "Negros Occidental", country: "Philippines", open_date: "2022-09-15", status: "Active", capacity_girls: 8, capacity_staff: 4, current_occupancy: 3 },
  { safehouse_id: 9, safehouse_code: "MIN-003", name: "New Dawn Zamboanga", region: "Mindanao", city: "Zamboanga City", province: "Zamboanga del Sur", country: "Philippines", open_date: "2023-01-10", status: "Active", capacity_girls: 6, capacity_staff: 3, current_occupancy: 2 },
];

// --- Supporters ---
export const mockSupporters: Supporter[] = Array.from({ length: 20 }, (_, i) => ({
  supporter_id: i + 1,
  supporter_type: (["MonetaryDonor", "InKindDonor", "Volunteer", "SkillsContributor", "SocialMediaAdvocate"] as const)[i % 5],
  display_name: ["Maria Santos", "John Rivera", "Global Hope Foundation", "Ana Chen", "David Park", "Grace Kim", "Michael Torres", "Sarah Johnson", "Robert Garcia", "Emily White", "James Lee", "Catherine Moore", "Daniel Cruz", "Lisa Wang", "Peter Brown", "Helen Reyes", "Mark Thompson", "Rachel Tan", "Steven Davis", "Amy Mitchell"][i],
  first_name: ["Maria", "John", "Global", "Ana", "David", "Grace", "Michael", "Sarah", "Robert", "Emily", "James", "Catherine", "Daniel", "Lisa", "Peter", "Helen", "Mark", "Rachel", "Steven", "Amy"][i],
  last_name: ["Santos", "Rivera", "Hope", "Chen", "Park", "Kim", "Torres", "Johnson", "Garcia", "White", "Lee", "Moore", "Cruz", "Wang", "Brown", "Reyes", "Thompson", "Tan", "Davis", "Mitchell"][i],
  organization_name: i === 2 ? "Global Hope Foundation" : undefined,
  relationship_type: "Donor",
  region: ["Luzon", "Visayas", "Mindanao"][i % 3],
  country: i < 10 ? "Philippines" : "United States",
  email: `supporter${i + 1}@example.com`,
  phone: "+63 912 345 6789",
  status: i < 18 ? "Active" : "Inactive",
  created_at: `2023-${String((i % 12) + 1).padStart(2, "0")}-15`,
  first_donation_date: `2023-${String((i % 12) + 1).padStart(2, "0")}-20`,
  acquisition_channel: (["Website", "SocialMedia", "Event", "WordOfMouth", "PartnerReferral", "Church"] as const)[i % 6],
  churn_risk: Math.round(Math.random() * 100),
}));

// --- Donations ---
export const mockDonations: Donation[] = Array.from({ length: 30 }, (_, i) => ({
  donation_id: i + 1,
  supporter_id: (i % 20) + 1,
  donation_type: (["Monetary", "InKind", "Monetary", "Monetary", "Monetary"] as const)[i % 5],
  donation_date: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  is_recurring: i % 3 === 0,
  campaign_name: ([null, "Year-End Hope", "Back to School", "Summer of Safety", "GivingTuesday"] as const)[i % 5],
  channel_source: (["Campaign", "Event", "Direct", "SocialMedia", "PartnerReferral"] as const)[i % 5],
  currency_code: "PHP",
  amount: Math.round((Math.random() * 50000 + 1000) * 100) / 100,
  notes: "",
  supporter: mockSupporters[(i % 20)],
}));

// --- Donation Allocations ---
export const mockAllocations: DonationAllocation[] = Array.from({ length: 30 }, (_, i) => ({
  allocation_id: i + 1,
  donation_id: i + 1,
  safehouse_id: (i % 9) + 1,
  program_area: (["Education", "Health", "Psychosocial", "Reintegration", "Operations"] as const)[i % 5],
  amount_allocated: mockDonations[i]?.amount ?? 5000,
  allocation_date: mockDonations[i]?.donation_date ?? "2024-01-01",
  safehouse: mockSafehouses[i % 9],
}));

// --- Residents ---
export const mockResidents: Resident[] = Array.from({ length: 15 }, (_, i) => ({
  resident_id: i + 1,
  case_control_no: `CC-2024-${String(i + 1).padStart(4, "0")}`,
  internal_code: `R-${String(i + 1).padStart(3, "0")}`,
  safehouse_id: (i % 9) + 1,
  case_status: (["Active", "Active", "Active", "Closed"] as const)[i % 4],
  sex: "Female",
  date_of_birth: `${2010 + (i % 8)}-${String((i % 12) + 1).padStart(2, "0")}-15`,
  birth_status: "Legitimate",
  place_of_birth: "Metro Manila",
  religion: "Catholic",
  case_category: (["Abandoned", "Neglected", "Surrendered", "Foundling"] as const)[i % 4],
  sub_cat_orphaned: i % 5 === 0,
  sub_cat_trafficked: i % 3 === 0,
  sub_cat_child_labor: i % 7 === 0,
  sub_cat_physical_abuse: i % 2 === 0,
  sub_cat_sexual_abuse: i % 4 === 0,
  sub_cat_osaec: false,
  sub_cat_cicl: false,
  sub_cat_at_risk: i % 3 === 0,
  sub_cat_street_child: false,
  sub_cat_child_with_hiv: false,
  is_pwd: i % 8 === 0,
  pwd_type: i % 8 === 0 ? "Visual" : undefined,
  has_special_needs: i % 6 === 0,
  special_needs_diagnosis: i % 6 === 0 ? "ADHD" : undefined,
  family_is_4ps: i % 3 === 0,
  family_solo_parent: i % 4 === 0,
  family_indigenous: i % 10 === 0,
  family_parent_pwd: false,
  family_informal_settler: i % 5 === 0,
  date_of_admission: `2023-${String((i % 12) + 1).padStart(2, "0")}-10`,
  age_upon_admission: 8 + (i % 8),
  present_age: 10 + (i % 8),
  length_of_stay: 12 + i * 2,
  referral_source: "DSWD",
  referring_agency_person: "SW Maria Santos",
  assigned_social_worker: ["SW Anna Cruz", "SW Maria Reyes", "SW Lisa Torres"][i % 3],
  reintegration_type: (["Family Reunification", "Foster Care", "None", "Independent Living"] as const)[i % 4],
  reintegration_status: (["Not Started", "In Progress", "Completed", "On Hold"] as const)[i % 4],
  initial_risk_level: (["Low", "Medium", "High", "Critical"] as const)[i % 4],
  current_risk_level: (["Low", "Medium", "High", "Critical"] as const)[(i + 1) % 4],
  created_at: `2023-${String((i % 12) + 1).padStart(2, "0")}-10`,
  safehouse: mockSafehouses[i % 9],
  readiness_score: Math.round(Math.random() * 100),
}));

// --- Process Recordings ---
export const mockProcessRecordings: ProcessRecording[] = Array.from({ length: 30 }, (_, i) => ({
  recording_id: i + 1,
  resident_id: (i % 15) + 1,
  session_date: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  social_worker: ["SW Anna Cruz", "SW Maria Reyes", "SW Lisa Torres"][i % 3],
  session_type: (["Individual", "Group"] as const)[i % 2],
  session_duration_minutes: 30 + (i % 4) * 15,
  emotional_state_observed: (["Anxious", "Sad", "Withdrawn", "Angry", "Calm", "Distressed", "Hopeful", "Happy"] as const)[i % 8],
  emotional_state_end: (["Calm", "Hopeful", "Calm", "Sad", "Happy", "Calm", "Happy", "Happy"] as const)[i % 8],
  session_narrative: "The session focused on building trust and emotional regulation strategies. The resident showed progress in identifying and expressing emotions.",
  interventions_applied: "Cognitive behavioral therapy, art therapy, guided journaling",
  follow_up_actions: "Continue weekly sessions, coordinate with education team",
  progress_noted: i % 3 !== 2,
  concerns_flagged: i % 5 === 0,
  referral_made: i % 7 === 0,
  resident: mockResidents[i % 15],
}));

// --- Home Visitations ---
export const mockHomeVisitations: HomeVisitation[] = Array.from({ length: 20 }, (_, i) => ({
  visitation_id: i + 1,
  resident_id: (i % 15) + 1,
  visit_date: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  social_worker: ["SW Anna Cruz", "SW Maria Reyes", "SW Lisa Torres"][i % 3],
  visit_type: (["Initial Assessment", "Routine Follow-Up", "Reintegration Assessment", "Post-Placement Monitoring", "Emergency"] as const)[i % 5],
  location_visited: "Family residence, Barangay San Antonio",
  family_members_present: "Mother, grandmother",
  purpose: "Assess family environment and readiness for reintegration",
  observations: "The family home is clean and well-maintained. Family members showed genuine concern for the child's wellbeing.",
  family_cooperation_level: (["Highly Cooperative", "Cooperative", "Neutral", "Uncooperative"] as const)[i % 4],
  safety_concerns_noted: i % 6 === 0,
  follow_up_needed: i % 2 === 0,
  follow_up_notes: "Schedule follow-up in 2 weeks",
  visit_outcome: (["Favorable", "Needs Improvement", "Favorable", "Inconclusive"] as const)[i % 4],
  resident: mockResidents[i % 15],
}));

// --- Education Records ---
export const mockEducationRecords: EducationRecord[] = Array.from({ length: 15 }, (_, i) => ({
  education_record_id: i + 1,
  resident_id: (i % 15) + 1,
  record_date: `2024-${String((i % 12) + 1).padStart(2, "0")}-15`,
  education_level: (["Primary", "Secondary", "Vocational", "CollegePrep"] as const)[i % 4],
  school_name: "Bahay Pag-asa Learning Center",
  enrollment_status: "Enrolled",
  attendance_rate: 80 + Math.round(Math.random() * 20),
  progress_percent: 40 + Math.round(Math.random() * 55),
  completion_status: (["InProgress", "InProgress", "Completed", "NotStarted"] as const)[i % 4],
}));

// --- Health Records ---
export const mockHealthRecords: HealthRecord[] = Array.from({ length: 15 }, (_, i) => ({
  health_record_id: i + 1,
  resident_id: (i % 15) + 1,
  record_date: `2024-${String((i % 12) + 1).padStart(2, "0")}-15`,
  general_health_score: 2.5 + Math.random() * 2.5,
  nutrition_score: 2.5 + Math.random() * 2.5,
  sleep_quality_score: 2 + Math.random() * 3,
  energy_level_score: 2.5 + Math.random() * 2.5,
  height_cm: 130 + i * 3,
  weight_kg: 30 + i * 2,
  bmi: 18 + Math.random() * 4,
  medical_checkup_done: i % 2 === 0,
  dental_checkup_done: i % 3 === 0,
  psychological_checkup_done: i % 2 === 0,
}));

// --- Intervention Plans ---
export const mockInterventionPlans: InterventionPlan[] = Array.from({ length: 12 }, (_, i) => ({
  plan_id: i + 1,
  resident_id: (i % 15) + 1,
  plan_category: (["Safety", "Psychosocial", "Education", "Physical Health", "Legal", "Reintegration"] as const)[i % 6],
  plan_description: [
    "Establish safe routines and build trust with caregivers",
    "Weekly counseling sessions focusing on trauma recovery",
    "Enroll in accelerated learning program",
    "Regular health monitoring and nutrition plan",
    "Prepare legal documentation for protective custody",
    "Gradual family reconnection and transition planning",
  ][i % 6],
  services_provided: "Counseling, education support, health monitoring",
  target_value: 100,
  target_date: `2025-${String((i % 12) + 1).padStart(2, "0")}-30`,
  status: (["Open", "In Progress", "Achieved", "On Hold", "Closed"] as const)[i % 5],
  case_conference_date: i % 3 === 0 ? `2024-${String((i % 12) + 1).padStart(2, "0")}-15` : undefined,
  created_at: `2024-01-${String(i + 1).padStart(2, "0")}`,
  updated_at: `2024-06-${String(i + 1).padStart(2, "0")}`,
}));

// --- Incident Reports ---
export const mockIncidentReports: IncidentReport[] = Array.from({ length: 10 }, (_, i) => ({
  incident_id: i + 1,
  resident_id: (i % 15) + 1,
  safehouse_id: (i % 9) + 1,
  incident_date: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  incident_type: (["Behavioral", "Medical", "Security", "ConflictWithPeer", "SelfHarm", "RunawayAttempt", "PropertyDamage"] as const)[i % 7],
  severity: (["Low", "Medium", "High"] as const)[i % 3],
  description: "Incident details would be documented here with appropriate context and observations.",
  response_taken: "Staff intervened immediately and followed established protocols.",
  resolved: i % 3 !== 0,
  resolution_date: i % 3 !== 0 ? `2024-${String((i % 12) + 1).padStart(2, "0")}-${String(Math.min((i % 28) + 3, 28)).padStart(2, "0")}` : undefined,
  reported_by: ["SW Anna Cruz", "SW Maria Reyes", "Housemother Elena"][i % 3],
  follow_up_required: i % 2 === 0,
}));

// --- Social Media Posts ---
export const mockSocialMediaPosts: SocialMediaPost[] = Array.from({ length: 25 }, (_, i) => ({
  post_id: i + 1,
  platform: (["Facebook", "Instagram", "Twitter", "TikTok", "LinkedIn", "YouTube", "WhatsApp"] as const)[i % 7],
  post_url: `https://example.com/post/${i + 1}`,
  created_at: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  day_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i % 7],
  post_hour: 8 + (i % 14),
  post_type: (["ImpactStory", "Campaign", "EventPromotion", "ThankYou", "EducationalContent", "FundraisingAppeal"] as const)[i % 6],
  media_type: (["Photo", "Video", "Carousel", "Text", "Reel"] as const)[i % 5],
  caption: "Every child deserves a safe place to call home. Your support makes this possible. #PharosHope #ProtectChildren",
  hashtags: "#PharosHope #ProtectChildren #SafeHomes",
  num_hashtags: 3,
  mentions_count: i % 3,
  has_call_to_action: i % 2 === 0,
  call_to_action_type: i % 2 === 0 ? (["DonateNow", "LearnMore", "ShareStory", "SignUp"] as const)[i % 4] : undefined,
  content_topic: (["Education", "Health", "Reintegration", "DonorImpact", "SafehouseLife", "Gratitude", "AwarenessRaising"] as const)[i % 7],
  sentiment_tone: (["Hopeful", "Urgent", "Celebratory", "Informative", "Grateful", "Emotional"] as const)[i % 6],
  caption_length: 80 + i * 10,
  features_resident_story: i % 4 === 0,
  campaign_name: i % 3 === 0 ? "Year-End Hope" : undefined,
  is_boosted: i % 5 === 0,
  boost_budget_php: i % 5 === 0 ? 500 + i * 100 : 0,
  impressions: 500 + Math.round(Math.random() * 10000),
  reach: 300 + Math.round(Math.random() * 8000),
  likes: 50 + Math.round(Math.random() * 500),
  comments: 5 + Math.round(Math.random() * 50),
  shares: 10 + Math.round(Math.random() * 100),
  saves: 5 + Math.round(Math.random() * 30),
  click_throughs: 10 + Math.round(Math.random() * 200),
  video_views: i % 3 === 0 ? 1000 + Math.round(Math.random() * 5000) : 0,
  engagement_rate: Math.round(Math.random() * 10 * 100) / 100,
  profile_visits: 10 + Math.round(Math.random() * 50),
  donation_referrals: Math.round(Math.random() * 5),
  estimated_donation_value_php: Math.round(Math.random() * 5000),
  follower_count_at_post: 5000 + i * 200,
  watch_time_seconds: i % 3 === 0 ? 30000 + Math.round(Math.random() * 50000) : 0,
  avg_view_duration_seconds: i % 3 === 0 ? 15 + Math.round(Math.random() * 45) : 0,
  subscriber_count_at_post: 3000 + i * 100,
  forwards: Math.round(Math.random() * 20),
}));

// --- Social Media Comments ---
export const mockSocialComments: SocialMediaComment[] = Array.from({ length: 15 }, (_, i) => ({
  comment_id: `cmt-${i + 1}`,
  post_id: (i % 25) + 1,
  platform: (["Facebook", "Instagram", "LinkedIn", "YouTube"] as const)[i % 4],
  commenter_name: ["Anna M.", "John D.", "Grace L.", "Miguel R.", "Sarah K."][i % 5],
  comment_text: [
    "This is amazing work! So inspiring!",
    "How can I donate?",
    "God bless you all for this wonderful mission.",
    "Shared with my church group!",
    "Can I volunteer remotely?",
  ][i % 5],
  timestamp: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}T${String(8 + (i % 12)).padStart(2, "0")}:00:00.000Z`,
  is_read: i < 8,
  sentiment: i % 3 === 0 ? "positive" : i % 5 === 0 ? "question" : "positive",
}));

// --- Partners ---
export const mockPartners: Partner[] = Array.from({ length: 10 }, (_, i) => ({
  partner_id: i + 1,
  partner_name: ["DSWD Regional", "UNICEF Philippines", "Save the Children", "World Vision", "Plan International", "ChildFund", "SOS Children", "Caritas Manila", "ECPAT", "IJM Philippines"][i],
  partner_type: (["Government", "NGO", "NGO", "NGO", "NGO", "NGO", "NGO", "Faith-Based", "NGO", "NGO"] as const)[i],
  role_type: "Strategic Partner",
  contact_name: `Contact Person ${i + 1}`,
  email: `partner${i + 1}@example.org`,
  phone: "+63 912 345 6789",
  region: ["Luzon", "National", "National", "Visayas", "Mindanao"][i % 5],
  status: "Active",
  start_date: `2020-${String((i % 12) + 1).padStart(2, "0")}-01`,
}));

// --- Safehouse Monthly Metrics ---
export const mockMonthlyMetrics: SafehouseMonthlyMetric[] = Array.from({ length: 24 }, (_, i) => ({
  metric_id: i + 1,
  safehouse_id: (i % 9) + 1,
  month_start: `2024-${String((i % 12) + 1).padStart(2, "0")}-01`,
  month_end: `2024-${String((i % 12) + 1).padStart(2, "0")}-28`,
  active_residents: 5 + Math.round(Math.random() * 10),
  avg_education_progress: 50 + Math.round(Math.random() * 40),
  avg_health_score: 3 + Math.random() * 1.5,
  process_recording_count: 15 + Math.round(Math.random() * 30),
  home_visitation_count: 5 + Math.round(Math.random() * 10),
  incident_count: Math.round(Math.random() * 3),
  safehouse: mockSafehouses[i % 9],
}));

// --- Public Impact Snapshots ---
export const mockImpactSnapshots: PublicImpactSnapshot[] = Array.from({ length: 6 }, (_, i) => ({
  snapshot_id: i + 1,
  snapshot_date: `2024-${String(12 - i * 2).padStart(2, "0")}-01`,
  headline: ["Record Education Progress Achieved", "Health Scores Reach New Highs", "Successful Reintegrations Celebrated", "New Safehouse Opens in Mindanao", "GivingTuesday Campaign Exceeds Goals", "Summer of Safety Program Completes"][i],
  summary_text: "This month we continued to make significant strides in providing comprehensive care and support for the girls in our safehouses. Education progress improved across all regions, and our health programs showed measurable positive outcomes.",
  metric_payload_json: JSON.stringify({ residents_served: 57 + i, education_progress: 72 + i * 2, health_score: 3.8 + i * 0.1, sessions: 150 + i * 10 }),
  is_published: true,
  published_at: `2024-${String(12 - i * 2).padStart(2, "0")}-05`,
}));

// --- Dashboard Stats ---
export const mockDashboardStats: DashboardStats = {
  activeResidents: 57,
  monthlyDonations: 387500,
  casesNeedingReview: 8,
  socialEngagement: 4.7,
  activeResidentsTrend: 5.2,
  monthlyDonationsTrend: 12.3,
  casesNeedingReviewTrend: -15,
  socialEngagementTrend: 8.1,
};

// --- Activity Feed ---
export const mockActivityFeed: ActivityFeedItem[] = [
  { id: "1", type: "donation", title: "New Donation Received", description: "Maria Santos donated ₱15,000 to Year-End Hope campaign", timestamp: "2024-12-15T10:30:00Z" },
  { id: "2", type: "recording", title: "Session Recorded", description: "SW Anna Cruz completed session with R-003", timestamp: "2024-12-15T09:15:00Z" },
  { id: "3", type: "incident", title: "Incident Reported", description: "Behavioral incident at Bahay Pag-asa Luzon — resolved", timestamp: "2024-12-14T16:45:00Z" },
  { id: "4", type: "social", title: "Post Published", description: "Impact story posted on Facebook — 2.3K reach", timestamp: "2024-12-14T14:00:00Z" },
  { id: "5", type: "visitation", title: "Home Visit Completed", description: "SW Maria Reyes visited family of R-007 — Favorable outcome", timestamp: "2024-12-14T11:30:00Z" },
  { id: "6", type: "donation", title: "Recurring Donation", description: "John Rivera's monthly ₱5,000 donation processed", timestamp: "2024-12-13T08:00:00Z" },
  { id: "7", type: "recording", title: "Group Session", description: "Group therapy session completed at Lighthouse Cebu", timestamp: "2024-12-13T15:00:00Z" },
  { id: "8", type: "social", title: "Campaign Launched", description: "Year-End Hope campaign launched across all platforms", timestamp: "2024-12-12T10:00:00Z" },
];

// --- Risk Alerts ---
export const mockRiskAlerts: RiskAlert[] = [
  { id: "ra-1", type: "resident", name: "R-005", riskScore: 85, riskLevel: "Critical", recommendedAction: "Schedule immediate case conference", link: "/admin/residents/5" },
  { id: "ra-2", type: "donor", name: "John Rivera", riskScore: 72, riskLevel: "High", recommendedAction: "Send personalized impact report", link: "/admin/donors/2" },
  { id: "ra-3", type: "resident", name: "R-012", riskScore: 68, riskLevel: "High", recommendedAction: "Review recent incident reports", link: "/admin/residents/12" },
  { id: "ra-4", type: "donor", name: "Grace Kim", riskScore: 55, riskLevel: "Medium", recommendedAction: "Schedule check-in call", link: "/admin/donors/6" },
];

// --- Donation Trends ---
export const mockDonationTrends: DonationTrend[] = Array.from({ length: 12 }, (_, i) => ({
  month: `2024-${String(i + 1).padStart(2, "0")}`,
  total: 250000 + Math.round(Math.random() * 200000),
  monetary: 200000 + Math.round(Math.random() * 150000),
  inKind: 30000 + Math.round(Math.random() * 50000),
  recurring: 100000 + Math.round(Math.random() * 80000),
  oneTime: 150000 + Math.round(Math.random() * 120000),
}));
