// ============================================================
// Pharos TypeScript Interfaces — Source of truth for all entities
// ============================================================

// --- Auth ---
export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  linkedSupporterId?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  requiresMfa?: boolean;
}

// --- API Response Wrapper ---
export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- Safehouses ---
export interface Safehouse {
  safehouse_id: number;
  safehouse_code: string;
  name: string;
  region: string;
  city: string;
  province: string;
  country: string;
  open_date: string;
  status: string;
  capacity_girls: number;
  capacity_staff: number;
  current_occupancy: number;
  notes?: string;
}

// --- Partners ---
export interface Partner {
  partner_id: number;
  partner_name: string;
  partner_type: string;
  role_type: string;
  contact_name: string;
  email: string;
  phone: string;
  region: string;
  status: string;
  start_date: string;
  end_date?: string;
  notes?: string;
}

export interface PartnerAssignment {
  assignment_id: number;
  partner_id: number;
  safehouse_id: number;
  program_area: string;
  assignment_start: string;
  assignment_end?: string;
  responsibility_notes?: string;
  is_primary: boolean;
  status: string;
}

// --- Supporters (Donors) ---
export type SupporterType =
  | "MonetaryDonor"
  | "InKindDonor"
  | "Volunteer"
  | "SkillsContributor"
  | "SocialMediaAdvocate"
  | "PartnerOrganization";

export type AcquisitionChannel =
  | "Website"
  | "SocialMedia"
  | "Event"
  | "WordOfMouth"
  | "PartnerReferral"
  | "Church";

export interface Supporter {
  supporter_id: number;
  supporter_type: SupporterType;
  display_name: string;
  organization_name?: string;
  first_name: string;
  last_name: string;
  relationship_type: string;
  region: string;
  country: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  first_donation_date?: string;
  acquisition_channel: AcquisitionChannel;
  churn_risk?: number; // ML-generated
}

// --- Donations ---
export type DonationType =
  | "Monetary"
  | "InKind"
  | "Time"
  | "Skills"
  | "SocialMedia";

export type ChannelSource =
  | "Campaign"
  | "Event"
  | "Direct"
  | "SocialMedia"
  | "PartnerReferral";

export type CampaignName =
  | "Year-End Hope"
  | "Back to School"
  | "Summer of Safety"
  | "GivingTuesday"
  | null;

export interface Donation {
  donation_id: number;
  supporter_id: number;
  donation_type: DonationType;
  donation_date: string;
  is_recurring: boolean;
  campaign_name: CampaignName;
  channel_source: ChannelSource;
  currency_code: string;
  amount: number;
  estimated_value?: number;
  impact_unit?: string;
  notes?: string;
  referral_post_id?: number;
  supporter?: Supporter;
}

export interface InKindDonationItem {
  item_id: number;
  donation_id: number;
  item_name: string;
  item_category: string;
  quantity: number;
  unit_of_measure: string;
  estimated_unit_value: number;
  intended_use: string;
  received_condition: string;
}

export interface DonationAllocation {
  allocation_id: number;
  donation_id: number;
  safehouse_id: number;
  program_area: string;
  amount_allocated: number;
  allocation_date: string;
  allocation_notes?: string;
  safehouse?: Safehouse;
}

// --- Residents ---
export type CaseStatus = "Active" | "Closed" | "Transferred";
export type CaseCategory =
  | "Abandoned"
  | "Foundling"
  | "Surrendered"
  | "Neglected";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type ReintegrationType =
  | "Family Reunification"
  | "Foster Care"
  | "Adoption (Domestic)"
  | "Adoption (Inter-Country)"
  | "Independent Living"
  | "None";
export type ReintegrationStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "On Hold";

export interface Resident {
  resident_id: number;
  case_control_no: string;
  internal_code: string;
  safehouse_id: number;
  case_status: CaseStatus;
  sex: string;
  date_of_birth: string;
  birth_status: string;
  place_of_birth: string;
  religion: string;
  case_category: CaseCategory;
  sub_cat_orphaned: boolean;
  sub_cat_trafficked: boolean;
  sub_cat_child_labor: boolean;
  sub_cat_physical_abuse: boolean;
  sub_cat_sexual_abuse: boolean;
  sub_cat_osaec: boolean;
  sub_cat_cicl: boolean;
  sub_cat_at_risk: boolean;
  sub_cat_street_child: boolean;
  sub_cat_child_with_hiv: boolean;
  is_pwd: boolean;
  pwd_type?: string;
  has_special_needs: boolean;
  special_needs_diagnosis?: string;
  family_is_4ps: boolean;
  family_solo_parent: boolean;
  family_indigenous: boolean;
  family_parent_pwd: boolean;
  family_informal_settler: boolean;
  date_of_admission: string;
  age_upon_admission: number;
  present_age: number;
  length_of_stay: number;
  referral_source: string;
  referring_agency_person: string;
  date_colb_registered?: string;
  date_colb_obtained?: string;
  assigned_social_worker: string;
  initial_case_assessment?: string;
  date_case_study_prepared?: string;
  reintegration_type: ReintegrationType;
  reintegration_status: ReintegrationStatus;
  initial_risk_level: RiskLevel;
  current_risk_level: RiskLevel;
  date_enrolled?: string;
  date_closed?: string;
  created_at: string;
  notes_restricted?: string;
  safehouse?: Safehouse;
  readiness_score?: number; // ML-generated
}

// --- Process Recordings ---
export type SessionType = "Individual" | "Group";
export type EmotionalState =
  | "Calm"
  | "Anxious"
  | "Sad"
  | "Angry"
  | "Hopeful"
  | "Withdrawn"
  | "Happy"
  | "Distressed";

export interface ProcessRecording {
  recording_id: number;
  resident_id: number;
  session_date: string;
  social_worker: string;
  session_type: SessionType;
  session_duration_minutes: number;
  emotional_state_observed: EmotionalState;
  emotional_state_end: EmotionalState;
  session_narrative: string;
  interventions_applied: string;
  follow_up_actions: string;
  progress_noted: boolean;
  concerns_flagged: boolean;
  referral_made: boolean;
  notes_restricted?: string;
  resident?: Resident;
}

// --- Home Visitations ---
export type VisitType =
  | "Initial Assessment"
  | "Routine Follow-Up"
  | "Reintegration Assessment"
  | "Post-Placement Monitoring"
  | "Emergency";
export type CooperationLevel =
  | "Highly Cooperative"
  | "Cooperative"
  | "Neutral"
  | "Uncooperative";
export type VisitOutcome =
  | "Favorable"
  | "Needs Improvement"
  | "Unfavorable"
  | "Inconclusive";

export interface HomeVisitation {
  visitation_id: number;
  resident_id: number;
  visit_date: string;
  social_worker: string;
  visit_type: VisitType;
  location_visited: string;
  family_members_present: string;
  purpose: string;
  observations: string;
  family_cooperation_level: CooperationLevel;
  safety_concerns_noted: boolean;
  follow_up_needed: boolean;
  follow_up_notes?: string;
  visit_outcome: VisitOutcome;
  resident?: Resident;
}

// --- Education Records ---
export type EducationLevel =
  | "Primary"
  | "Secondary"
  | "Vocational"
  | "CollegePrep";
export type CompletionStatus = "NotStarted" | "InProgress" | "Completed";

export interface EducationRecord {
  education_record_id: number;
  resident_id: number;
  record_date: string;
  education_level: EducationLevel;
  school_name: string;
  enrollment_status: string;
  attendance_rate: number;
  progress_percent: number;
  completion_status: CompletionStatus;
  notes?: string;
}

// --- Health & Wellbeing Records ---
export interface HealthRecord {
  health_record_id: number;
  resident_id: number;
  record_date: string;
  general_health_score: number;
  nutrition_score: number;
  sleep_quality_score: number;
  energy_level_score: number;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  medical_checkup_done: boolean;
  dental_checkup_done: boolean;
  psychological_checkup_done: boolean;
  notes?: string;
}

// --- Intervention Plans ---
export type PlanCategory =
  | "Safety"
  | "Psychosocial"
  | "Education"
  | "Physical Health"
  | "Legal"
  | "Reintegration";
export type PlanStatus =
  | "Open"
  | "In Progress"
  | "Achieved"
  | "On Hold"
  | "Closed";

export interface InterventionPlan {
  plan_id: number;
  resident_id: number;
  plan_category: PlanCategory;
  plan_description: string;
  services_provided: string;
  target_value: number;
  target_date: string;
  status: PlanStatus;
  case_conference_date?: string;
  created_at: string;
  updated_at: string;
}

// --- Incident Reports ---
export type IncidentType =
  | "Behavioral"
  | "Medical"
  | "Security"
  | "RunawayAttempt"
  | "SelfHarm"
  | "ConflictWithPeer"
  | "PropertyDamage";
export type Severity = "Low" | "Medium" | "High";

export interface IncidentReport {
  incident_id: number;
  resident_id: number;
  safehouse_id: number;
  incident_date: string;
  incident_type: IncidentType;
  severity: Severity;
  description: string;
  response_taken: string;
  resolved: boolean;
  resolution_date?: string;
  reported_by: string;
  follow_up_required: boolean;
}

// --- Social Media ---
export type Platform =
  | "Facebook"
  | "Instagram"
  | "Twitter"
  | "TikTok"
  | "LinkedIn"
  | "YouTube"
  | "WhatsApp";
export type PostType =
  | "ImpactStory"
  | "Campaign"
  | "EventPromotion"
  | "ThankYou"
  | "EducationalContent"
  | "FundraisingAppeal";
export type MediaType = "Photo" | "Video" | "Carousel" | "Text" | "Reel";
export type ContentTopic =
  | "Education"
  | "Health"
  | "Reintegration"
  | "DonorImpact"
  | "SafehouseLife"
  | "EventRecap"
  | "CampaignLaunch"
  | "Gratitude"
  | "AwarenessRaising";
export type SentimentTone =
  | "Hopeful"
  | "Urgent"
  | "Celebratory"
  | "Informative"
  | "Grateful"
  | "Emotional";
export type CallToActionType =
  | "DonateNow"
  | "LearnMore"
  | "ShareStory"
  | "SignUp";

export interface SocialMediaPost {
  post_id: number;
  platform: Platform;
  platform_post_id?: string;
  post_url?: string;
  created_at: string;
  day_of_week: string;
  post_hour: number;
  post_type: PostType;
  media_type: MediaType;
  caption: string;
  hashtags: string;
  num_hashtags: number;
  mentions_count: number;
  has_call_to_action: boolean;
  call_to_action_type?: CallToActionType;
  content_topic: ContentTopic;
  sentiment_tone: SentimentTone;
  caption_length: number;
  features_resident_story: boolean;
  campaign_name?: string;
  is_boosted: boolean;
  boost_budget_php: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  click_throughs: number;
  video_views: number;
  engagement_rate: number;
  profile_visits: number;
  donation_referrals: number;
  estimated_donation_value_php: number;
  follower_count_at_post: number;
  watch_time_seconds: number;
  avg_view_duration_seconds: number;
  subscriber_count_at_post: number;
  forwards: number;
}

export interface SocialMediaComment {
  comment_id: string;
  post_id: number;
  platform: Platform;
  commenter_name: string;
  comment_text: string;
  timestamp: string;
  is_read: boolean;
  sentiment?: string;
  post_thumbnail?: string;
}

export interface ConnectedAccount {
  id: number;
  platform: Platform;
  accountName: string;
  accountId?: string;
  connectedAt: string;
  tokenExpiresAt?: string;
  status: string;
}

export interface CommentInboxResponse {
  comments: SocialMediaComment[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// --- Safehouse Monthly Metrics ---
export interface SafehouseMonthlyMetric {
  metric_id: number;
  safehouse_id: number;
  month_start: string;
  month_end: string;
  active_residents: number;
  avg_education_progress: number;
  avg_health_score: number;
  process_recording_count: number;
  home_visitation_count: number;
  incident_count: number;
  notes?: string;
  safehouse?: Safehouse;
}

// --- Public Impact Snapshots ---
export interface PublicImpactSnapshot {
  snapshot_id: number;
  snapshot_date: string;
  headline: string;
  summary_text: string;
  metric_payload_json: string;
  is_published: boolean;
  published_at?: string;
}

// --- ML Models ---
export interface DonorChurnRisk {
  supporter_id: number;
  risk_score: number;
  risk_level: RiskLevel;
  factors: string[];
  recommended_actions: string[];
}

export interface ReintegrationReadiness {
  resident_id: number;
  readiness_score: number;
  factors: { name: string; score: number; weight: number }[];
  recommendation: string;
}

export interface SocialMediaRecommendation {
  best_post_time: { day: string; hour: number };
  recommended_content_type: PostType;
  predicted_engagement_rate: number;
  campaign_insights: string[];
}

export interface InterventionEffectiveness {
  plan_category: PlanCategory;
  effectiveness_score: number;
  key_factors: string[];
  recommendations: string[];
}

// --- Dashboard Aggregates ---
export interface DashboardStats {
  activeResidents: number;
  monthlyDonations: number;
  casesNeedingReview: number;
  socialEngagement: number;
  activeResidentsTrend: number;
  monthlyDonationsTrend: number;
  casesNeedingReviewTrend: number;
  socialEngagementTrend: number;
}

export interface ActivityFeedItem {
  id: string;
  type: "donation" | "recording" | "incident" | "social" | "visitation";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export interface RiskAlert {
  id: string;
  type: "resident" | "donor";
  name: string;
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedAction: string;
  link: string;
}

// --- Reports ---
export interface DonationTrend {
  month: string;
  total: number;
  monetary: number;
  inKind: number;
  recurring: number;
  oneTime: number;
}

export interface CaseConferenceSummary {
  resident: Resident;
  latestRecordings: ProcessRecording[];
  healthTrend: HealthRecord[];
  educationTrend: EducationRecord[];
  recentIncidents: IncidentReport[];
  activePlans: InterventionPlan[];
  visitOutcomes: HomeVisitation[];
  readinessScore?: ReintegrationReadiness;
}
