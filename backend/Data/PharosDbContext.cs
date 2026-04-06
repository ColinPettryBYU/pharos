using Microsoft.EntityFrameworkCore;
using Pharos.Api.Models;

namespace Pharos.Api.Data;

public class PharosDbContext : DbContext
{
    public PharosDbContext(DbContextOptions<PharosDbContext> options) : base(options) { }

    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Safehouse ──
        modelBuilder.Entity<Safehouse>(entity =>
        {
            entity.ToTable("safehouses");
            entity.HasKey(e => e.SafehouseId);
            entity.Property(e => e.SafehouseId).HasColumnName("safehouse_id");
            entity.Property(e => e.SafehouseCode).HasColumnName("safehouse_code").HasMaxLength(20);
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(200);
            entity.Property(e => e.Region).HasColumnName("region").HasMaxLength(100);
            entity.Property(e => e.City).HasColumnName("city").HasMaxLength(100);
            entity.Property(e => e.Province).HasColumnName("province").HasMaxLength(100);
            entity.Property(e => e.Country).HasColumnName("country").HasMaxLength(100);
            entity.Property(e => e.OpenDate).HasColumnName("open_date");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(e => e.CapacityGirls).HasColumnName("capacity_girls");
            entity.Property(e => e.CapacityStaff).HasColumnName("capacity_staff");
            entity.Property(e => e.CurrentOccupancy).HasColumnName("current_occupancy");
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);
        });

        // ── Partner ──
        modelBuilder.Entity<Partner>(entity =>
        {
            entity.ToTable("partners");
            entity.HasKey(e => e.PartnerId);
            entity.Property(e => e.PartnerId).HasColumnName("partner_id");
            entity.Property(e => e.PartnerName).HasColumnName("partner_name").HasMaxLength(200);
            entity.Property(e => e.PartnerType).HasColumnName("partner_type").HasMaxLength(100);
            entity.Property(e => e.RoleType).HasColumnName("role_type").HasMaxLength(100);
            entity.Property(e => e.ContactName).HasColumnName("contact_name").HasMaxLength(200);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(200);
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(e => e.Region).HasColumnName("region").HasMaxLength(100);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);
        });

        // ── PartnerAssignment ──
        modelBuilder.Entity<PartnerAssignment>(entity =>
        {
            entity.ToTable("partner_assignments");
            entity.HasKey(e => e.AssignmentId);
            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.PartnerId).HasColumnName("partner_id");
            entity.Property(e => e.SafehouseId).HasColumnName("safehouse_id");
            entity.Property(e => e.ProgramArea).HasColumnName("program_area").HasMaxLength(100);
            entity.Property(e => e.AssignmentStart).HasColumnName("assignment_start");
            entity.Property(e => e.AssignmentEnd).HasColumnName("assignment_end");
            entity.Property(e => e.ResponsibilityNotes).HasColumnName("responsibility_notes").HasMaxLength(500);
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50);

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.PartnerAssignments)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Safehouse)
                .WithMany(s => s.PartnerAssignments)
                .HasForeignKey(e => e.SafehouseId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Supporter ──
        modelBuilder.Entity<Supporter>(entity =>
        {
            entity.ToTable("supporters");
            entity.HasKey(e => e.SupporterId);
            entity.Property(e => e.SupporterId).HasColumnName("supporter_id");
            entity.Property(e => e.SupporterType).HasColumnName("supporter_type").HasMaxLength(100);
            entity.Property(e => e.DisplayName).HasColumnName("display_name").HasMaxLength(200);
            entity.Property(e => e.OrganizationName).HasColumnName("organization_name").HasMaxLength(200);
            entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100);
            entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100);
            entity.Property(e => e.RelationshipType).HasColumnName("relationship_type").HasMaxLength(100);
            entity.Property(e => e.Region).HasColumnName("region").HasMaxLength(100);
            entity.Property(e => e.Country).HasColumnName("country").HasMaxLength(100);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(200);
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.FirstDonationDate).HasColumnName("first_donation_date");
            entity.Property(e => e.AcquisitionChannel).HasColumnName("acquisition_channel").HasMaxLength(100);
        });

        // ── SocialMediaPost ──
        modelBuilder.Entity<SocialMediaPost>(entity =>
        {
            entity.ToTable("social_media_posts");
            entity.HasKey(e => e.PostId);
            entity.Property(e => e.PostId).HasColumnName("post_id");
            entity.Property(e => e.Platform).HasColumnName("platform").HasMaxLength(50);
            entity.Property(e => e.PlatformPostId).HasColumnName("platform_post_id").HasMaxLength(200);
            entity.Property(e => e.PostUrl).HasColumnName("post_url").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.DayOfWeek).HasColumnName("day_of_week").HasMaxLength(20);
            entity.Property(e => e.PostHour).HasColumnName("post_hour");
            entity.Property(e => e.PostType).HasColumnName("post_type").HasMaxLength(100);
            entity.Property(e => e.MediaType).HasColumnName("media_type").HasMaxLength(50);
            entity.Property(e => e.Caption).HasColumnName("caption").HasMaxLength(4000);
            entity.Property(e => e.Hashtags).HasColumnName("hashtags").HasMaxLength(1000);
            entity.Property(e => e.NumHashtags).HasColumnName("num_hashtags");
            entity.Property(e => e.MentionsCount).HasColumnName("mentions_count");
            entity.Property(e => e.HasCallToAction).HasColumnName("has_call_to_action");
            entity.Property(e => e.CallToActionType).HasColumnName("call_to_action_type").HasMaxLength(100);
            entity.Property(e => e.ContentTopic).HasColumnName("content_topic").HasMaxLength(100);
            entity.Property(e => e.SentimentTone).HasColumnName("sentiment_tone").HasMaxLength(50);
            entity.Property(e => e.CaptionLength).HasColumnName("caption_length");
            entity.Property(e => e.FeaturesResidentStory).HasColumnName("features_resident_story");
            entity.Property(e => e.CampaignName).HasColumnName("campaign_name").HasMaxLength(200);
            entity.Property(e => e.IsBoosted).HasColumnName("is_boosted");
            entity.Property(e => e.BoostBudgetPhp).HasColumnName("boost_budget_php").HasPrecision(18, 2);
            entity.Property(e => e.Impressions).HasColumnName("impressions");
            entity.Property(e => e.Reach).HasColumnName("reach");
            entity.Property(e => e.Likes).HasColumnName("likes");
            entity.Property(e => e.Comments).HasColumnName("comments");
            entity.Property(e => e.Shares).HasColumnName("shares");
            entity.Property(e => e.Saves).HasColumnName("saves");
            entity.Property(e => e.ClickThroughs).HasColumnName("click_throughs");
            entity.Property(e => e.VideoViews).HasColumnName("video_views");
            entity.Property(e => e.EngagementRate).HasColumnName("engagement_rate").HasPrecision(10, 4);
            entity.Property(e => e.ProfileVisits).HasColumnName("profile_visits");
            entity.Property(e => e.DonationReferrals).HasColumnName("donation_referrals");
            entity.Property(e => e.EstimatedDonationValuePhp).HasColumnName("estimated_donation_value_php").HasPrecision(18, 2);
            entity.Property(e => e.FollowerCountAtPost).HasColumnName("follower_count_at_post");
            entity.Property(e => e.WatchTimeSeconds).HasColumnName("watch_time_seconds").HasPrecision(18, 2);
            entity.Property(e => e.AvgViewDurationSeconds).HasColumnName("avg_view_duration_seconds").HasPrecision(18, 2);
            entity.Property(e => e.SubscriberCountAtPost).HasColumnName("subscriber_count_at_post");
            entity.Property(e => e.Forwards).HasColumnName("forwards").HasPrecision(18, 2);
        });

        // ── Donation ──
        modelBuilder.Entity<Donation>(entity =>
        {
            entity.ToTable("donations");
            entity.HasKey(e => e.DonationId);
            entity.Property(e => e.DonationId).HasColumnName("donation_id");
            entity.Property(e => e.SupporterId).HasColumnName("supporter_id");
            entity.Property(e => e.DonationType).HasColumnName("donation_type").HasMaxLength(100);
            entity.Property(e => e.DonationDate).HasColumnName("donation_date");
            entity.Property(e => e.IsRecurring).HasColumnName("is_recurring");
            entity.Property(e => e.CampaignName).HasColumnName("campaign_name").HasMaxLength(200);
            entity.Property(e => e.ChannelSource).HasColumnName("channel_source").HasMaxLength(100);
            entity.Property(e => e.CurrencyCode).HasColumnName("currency_code").HasMaxLength(10);
            entity.Property(e => e.Amount).HasColumnName("amount").HasPrecision(18, 2);
            entity.Property(e => e.EstimatedValue).HasColumnName("estimated_value").HasPrecision(18, 2);
            entity.Property(e => e.ImpactUnit).HasColumnName("impact_unit").HasMaxLength(100);
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);
            entity.Property(e => e.ReferralPostId).HasColumnName("referral_post_id");

            entity.HasOne(e => e.Supporter)
                .WithMany(s => s.Donations)
                .HasForeignKey(e => e.SupporterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ReferralPost)
                .WithMany(p => p.ReferredDonations)
                .HasForeignKey(e => e.ReferralPostId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── InKindDonationItem ──
        modelBuilder.Entity<InKindDonationItem>(entity =>
        {
            entity.ToTable("in_kind_donation_items");
            entity.HasKey(e => e.ItemId);
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.DonationId).HasColumnName("donation_id");
            entity.Property(e => e.ItemName).HasColumnName("item_name").HasMaxLength(200);
            entity.Property(e => e.ItemCategory).HasColumnName("item_category").HasMaxLength(100);
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitOfMeasure).HasColumnName("unit_of_measure").HasMaxLength(50);
            entity.Property(e => e.EstimatedUnitValue).HasColumnName("estimated_unit_value").HasPrecision(18, 2);
            entity.Property(e => e.IntendedUse).HasColumnName("intended_use").HasMaxLength(200);
            entity.Property(e => e.ReceivedCondition).HasColumnName("received_condition").HasMaxLength(50);

            entity.HasOne(e => e.Donation)
                .WithMany(d => d.InKindItems)
                .HasForeignKey(e => e.DonationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── DonationAllocation ──
        modelBuilder.Entity<DonationAllocation>(entity =>
        {
            entity.ToTable("donation_allocations");
            entity.HasKey(e => e.AllocationId);
            entity.Property(e => e.AllocationId).HasColumnName("allocation_id");
            entity.Property(e => e.DonationId).HasColumnName("donation_id");
            entity.Property(e => e.SafehouseId).HasColumnName("safehouse_id");
            entity.Property(e => e.ProgramArea).HasColumnName("program_area").HasMaxLength(100);
            entity.Property(e => e.AmountAllocated).HasColumnName("amount_allocated").HasPrecision(18, 2);
            entity.Property(e => e.AllocationDate).HasColumnName("allocation_date");
            entity.Property(e => e.AllocationNotes).HasColumnName("allocation_notes").HasMaxLength(500);

            entity.HasOne(e => e.Donation)
                .WithMany(d => d.Allocations)
                .HasForeignKey(e => e.DonationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Safehouse)
                .WithMany(s => s.DonationAllocations)
                .HasForeignKey(e => e.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Resident ──
        modelBuilder.Entity<Resident>(entity =>
        {
            entity.ToTable("residents");
            entity.HasKey(e => e.ResidentId);
            entity.Property(e => e.ResidentId).HasColumnName("resident_id");
            entity.Property(e => e.CaseControlNo).HasColumnName("case_control_no").HasMaxLength(20);
            entity.Property(e => e.InternalCode).HasColumnName("internal_code").HasMaxLength(20);
            entity.Property(e => e.SafehouseId).HasColumnName("safehouse_id");
            entity.Property(e => e.CaseStatus).HasColumnName("case_status").HasMaxLength(50);
            entity.Property(e => e.Sex).HasColumnName("sex").HasMaxLength(10);
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
            entity.Property(e => e.BirthStatus).HasColumnName("birth_status").HasMaxLength(50);
            entity.Property(e => e.PlaceOfBirth).HasColumnName("place_of_birth").HasMaxLength(200);
            entity.Property(e => e.Religion).HasColumnName("religion").HasMaxLength(100);
            entity.Property(e => e.CaseCategory).HasColumnName("case_category").HasMaxLength(100);
            entity.Property(e => e.SubCatOrphaned).HasColumnName("sub_cat_orphaned");
            entity.Property(e => e.SubCatTrafficked).HasColumnName("sub_cat_trafficked");
            entity.Property(e => e.SubCatChildLabor).HasColumnName("sub_cat_child_labor");
            entity.Property(e => e.SubCatPhysicalAbuse).HasColumnName("sub_cat_physical_abuse");
            entity.Property(e => e.SubCatSexualAbuse).HasColumnName("sub_cat_sexual_abuse");
            entity.Property(e => e.SubCatOsaec).HasColumnName("sub_cat_osaec");
            entity.Property(e => e.SubCatCicl).HasColumnName("sub_cat_cicl");
            entity.Property(e => e.SubCatAtRisk).HasColumnName("sub_cat_at_risk");
            entity.Property(e => e.SubCatStreetChild).HasColumnName("sub_cat_street_child");
            entity.Property(e => e.SubCatChildWithHiv).HasColumnName("sub_cat_child_with_hiv");
            entity.Property(e => e.IsPwd).HasColumnName("is_pwd");
            entity.Property(e => e.PwdType).HasColumnName("pwd_type").HasMaxLength(100);
            entity.Property(e => e.HasSpecialNeeds).HasColumnName("has_special_needs");
            entity.Property(e => e.SpecialNeedsDiagnosis).HasColumnName("special_needs_diagnosis").HasMaxLength(200);
            entity.Property(e => e.FamilyIs4ps).HasColumnName("family_is_4ps");
            entity.Property(e => e.FamilySoloParent).HasColumnName("family_solo_parent");
            entity.Property(e => e.FamilyIndigenous).HasColumnName("family_indigenous");
            entity.Property(e => e.FamilyParentPwd).HasColumnName("family_parent_pwd");
            entity.Property(e => e.FamilyInformalSettler).HasColumnName("family_informal_settler");
            entity.Property(e => e.DateOfAdmission).HasColumnName("date_of_admission");
            entity.Property(e => e.AgeUponAdmission).HasColumnName("age_upon_admission").HasMaxLength(50);
            entity.Property(e => e.PresentAge).HasColumnName("present_age").HasMaxLength(50);
            entity.Property(e => e.LengthOfStay).HasColumnName("length_of_stay").HasMaxLength(50);
            entity.Property(e => e.ReferralSource).HasColumnName("referral_source").HasMaxLength(200);
            entity.Property(e => e.ReferringAgencyPerson).HasColumnName("referring_agency_person").HasMaxLength(200);
            entity.Property(e => e.DateColbRegistered).HasColumnName("date_colb_registered");
            entity.Property(e => e.DateColbObtained).HasColumnName("date_colb_obtained");
            entity.Property(e => e.AssignedSocialWorker).HasColumnName("assigned_social_worker").HasMaxLength(100);
            entity.Property(e => e.InitialCaseAssessment).HasColumnName("initial_case_assessment").HasMaxLength(500);
            entity.Property(e => e.DateCaseStudyPrepared).HasColumnName("date_case_study_prepared");
            entity.Property(e => e.ReintegrationType).HasColumnName("reintegration_type").HasMaxLength(100);
            entity.Property(e => e.ReintegrationStatus).HasColumnName("reintegration_status").HasMaxLength(50);
            entity.Property(e => e.InitialRiskLevel).HasColumnName("initial_risk_level").HasMaxLength(50);
            entity.Property(e => e.CurrentRiskLevel).HasColumnName("current_risk_level").HasMaxLength(50);
            entity.Property(e => e.DateEnrolled).HasColumnName("date_enrolled");
            entity.Property(e => e.DateClosed).HasColumnName("date_closed");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.NotesRestricted).HasColumnName("notes_restricted").HasMaxLength(2000);

            entity.HasOne(e => e.Safehouse)
                .WithMany(s => s.Residents)
                .HasForeignKey(e => e.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── ProcessRecording ──
        modelBuilder.Entity<ProcessRecording>(entity =>
        {
            entity.ToTable("process_recordings");
            entity.HasKey(e => e.RecordingId);
            entity.Property(e => e.RecordingId).HasColumnName("recording_id");
            entity.Property(e => e.ResidentId).HasColumnName("resident_id");
            entity.Property(e => e.SessionDate).HasColumnName("session_date");
            entity.Property(e => e.SocialWorker).HasColumnName("social_worker").HasMaxLength(100);
            entity.Property(e => e.SessionType).HasColumnName("session_type").HasMaxLength(50);
            entity.Property(e => e.SessionDurationMinutes).HasColumnName("session_duration_minutes");
            entity.Property(e => e.EmotionalStateObserved).HasColumnName("emotional_state_observed").HasMaxLength(50);
            entity.Property(e => e.EmotionalStateEnd).HasColumnName("emotional_state_end").HasMaxLength(50);
            entity.Property(e => e.SessionNarrative).HasColumnName("session_narrative").HasMaxLength(4000);
            entity.Property(e => e.InterventionsApplied).HasColumnName("interventions_applied").HasMaxLength(1000);
            entity.Property(e => e.FollowUpActions).HasColumnName("follow_up_actions").HasMaxLength(1000);
            entity.Property(e => e.ProgressNoted).HasColumnName("progress_noted").HasMaxLength(1000);
            entity.Property(e => e.ConcernsFlagged).HasColumnName("concerns_flagged").HasMaxLength(1000);
            entity.Property(e => e.ReferralMade).HasColumnName("referral_made");
            entity.Property(e => e.NotesRestricted).HasColumnName("notes_restricted").HasMaxLength(2000);

            entity.HasOne(e => e.Resident)
                .WithMany(r => r.ProcessRecordings)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── HomeVisitation ──
        modelBuilder.Entity<HomeVisitation>(entity =>
        {
            entity.ToTable("home_visitations");
            entity.HasKey(e => e.VisitationId);
            entity.Property(e => e.VisitationId).HasColumnName("visitation_id");
            entity.Property(e => e.ResidentId).HasColumnName("resident_id");
            entity.Property(e => e.VisitDate).HasColumnName("visit_date");
            entity.Property(e => e.SocialWorker).HasColumnName("social_worker").HasMaxLength(100);
            entity.Property(e => e.VisitType).HasColumnName("visit_type").HasMaxLength(100);
            entity.Property(e => e.LocationVisited).HasColumnName("location_visited").HasMaxLength(300);
            entity.Property(e => e.FamilyMembersPresent).HasColumnName("family_members_present").HasMaxLength(500);
            entity.Property(e => e.Purpose).HasColumnName("purpose").HasMaxLength(500);
            entity.Property(e => e.Observations).HasColumnName("observations").HasMaxLength(2000);
            entity.Property(e => e.FamilyCooperationLevel).HasColumnName("family_cooperation_level").HasMaxLength(50);
            entity.Property(e => e.SafetyConcernsNoted).HasColumnName("safety_concerns_noted").HasMaxLength(1000);
            entity.Property(e => e.FollowUpNeeded).HasColumnName("follow_up_needed");
            entity.Property(e => e.FollowUpNotes).HasColumnName("follow_up_notes").HasMaxLength(1000);
            entity.Property(e => e.VisitOutcome).HasColumnName("visit_outcome").HasMaxLength(50);

            entity.HasOne(e => e.Resident)
                .WithMany(r => r.HomeVisitations)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── EducationRecord ──
        modelBuilder.Entity<EducationRecord>(entity =>
        {
            entity.ToTable("education_records");
            entity.HasKey(e => e.EducationRecordId);
            entity.Property(e => e.EducationRecordId).HasColumnName("education_record_id");
            entity.Property(e => e.ResidentId).HasColumnName("resident_id");
            entity.Property(e => e.RecordDate).HasColumnName("record_date");
            entity.Property(e => e.EducationLevel).HasColumnName("education_level").HasMaxLength(50);
            entity.Property(e => e.SchoolName).HasColumnName("school_name").HasMaxLength(200);
            entity.Property(e => e.EnrollmentStatus).HasColumnName("enrollment_status").HasMaxLength(50);
            entity.Property(e => e.AttendanceRate).HasColumnName("attendance_rate").HasPrecision(5, 2);
            entity.Property(e => e.ProgressPercent).HasColumnName("progress_percent").HasPrecision(5, 2);
            entity.Property(e => e.CompletionStatus).HasColumnName("completion_status").HasMaxLength(50);
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);

            entity.HasOne(e => e.Resident)
                .WithMany(r => r.EducationRecords)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── HealthWellbeingRecord ──
        modelBuilder.Entity<HealthWellbeingRecord>(entity =>
        {
            entity.ToTable("health_wellbeing_records");
            entity.HasKey(e => e.HealthRecordId);
            entity.Property(e => e.HealthRecordId).HasColumnName("health_record_id");
            entity.Property(e => e.ResidentId).HasColumnName("resident_id");
            entity.Property(e => e.RecordDate).HasColumnName("record_date");
            entity.Property(e => e.GeneralHealthScore).HasColumnName("general_health_score").HasPrecision(4, 2);
            entity.Property(e => e.NutritionScore).HasColumnName("nutrition_score").HasPrecision(4, 2);
            entity.Property(e => e.SleepQualityScore).HasColumnName("sleep_quality_score").HasPrecision(4, 2);
            entity.Property(e => e.EnergyLevelScore).HasColumnName("energy_level_score").HasPrecision(4, 2);
            entity.Property(e => e.HeightCm).HasColumnName("height_cm").HasPrecision(6, 2);
            entity.Property(e => e.WeightKg).HasColumnName("weight_kg").HasPrecision(6, 2);
            entity.Property(e => e.Bmi).HasColumnName("bmi").HasPrecision(6, 2);
            entity.Property(e => e.MedicalCheckupDone).HasColumnName("medical_checkup_done");
            entity.Property(e => e.DentalCheckupDone).HasColumnName("dental_checkup_done");
            entity.Property(e => e.PsychologicalCheckupDone).HasColumnName("psychological_checkup_done");
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);

            entity.HasOne(e => e.Resident)
                .WithMany(r => r.HealthRecords)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── InterventionPlan ──
        modelBuilder.Entity<InterventionPlan>(entity =>
        {
            entity.ToTable("intervention_plans");
            entity.HasKey(e => e.PlanId);
            entity.Property(e => e.PlanId).HasColumnName("plan_id");
            entity.Property(e => e.ResidentId).HasColumnName("resident_id");
            entity.Property(e => e.PlanCategory).HasColumnName("plan_category").HasMaxLength(100);
            entity.Property(e => e.PlanDescription).HasColumnName("plan_description").HasMaxLength(1000);
            entity.Property(e => e.ServicesProvided).HasColumnName("services_provided").HasMaxLength(500);
            entity.Property(e => e.TargetValue).HasColumnName("target_value").HasPrecision(6, 2);
            entity.Property(e => e.TargetDate).HasColumnName("target_date");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(e => e.CaseConferenceDate).HasColumnName("case_conference_date");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(e => e.Resident)
                .WithMany(r => r.InterventionPlans)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── IncidentReport ──
        modelBuilder.Entity<IncidentReport>(entity =>
        {
            entity.ToTable("incident_reports");
            entity.HasKey(e => e.IncidentId);
            entity.Property(e => e.IncidentId).HasColumnName("incident_id");
            entity.Property(e => e.ResidentId).HasColumnName("resident_id");
            entity.Property(e => e.SafehouseId).HasColumnName("safehouse_id");
            entity.Property(e => e.IncidentDate).HasColumnName("incident_date");
            entity.Property(e => e.IncidentType).HasColumnName("incident_type").HasMaxLength(100);
            entity.Property(e => e.Severity).HasColumnName("severity").HasMaxLength(20);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(2000);
            entity.Property(e => e.ResponseTaken).HasColumnName("response_taken").HasMaxLength(1000);
            entity.Property(e => e.Resolved).HasColumnName("resolved");
            entity.Property(e => e.ResolutionDate).HasColumnName("resolution_date");
            entity.Property(e => e.ReportedBy).HasColumnName("reported_by").HasMaxLength(100);
            entity.Property(e => e.FollowUpRequired).HasColumnName("follow_up_required");

            entity.HasOne(e => e.Resident)
                .WithMany(r => r.IncidentReports)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Safehouse)
                .WithMany(s => s.IncidentReports)
                .HasForeignKey(e => e.SafehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── SafehouseMonthlyMetric ──
        modelBuilder.Entity<SafehouseMonthlyMetric>(entity =>
        {
            entity.ToTable("safehouse_monthly_metrics");
            entity.HasKey(e => e.MetricId);
            entity.Property(e => e.MetricId).HasColumnName("metric_id");
            entity.Property(e => e.SafehouseId).HasColumnName("safehouse_id");
            entity.Property(e => e.MonthStart).HasColumnName("month_start");
            entity.Property(e => e.MonthEnd).HasColumnName("month_end");
            entity.Property(e => e.ActiveResidents).HasColumnName("active_residents");
            entity.Property(e => e.AvgEducationProgress).HasColumnName("avg_education_progress").HasPrecision(6, 2);
            entity.Property(e => e.AvgHealthScore).HasColumnName("avg_health_score").HasPrecision(4, 2);
            entity.Property(e => e.ProcessRecordingCount).HasColumnName("process_recording_count");
            entity.Property(e => e.HomeVisitationCount).HasColumnName("home_visitation_count");
            entity.Property(e => e.IncidentCount).HasColumnName("incident_count");
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);

            entity.HasOne(e => e.Safehouse)
                .WithMany(s => s.MonthlyMetrics)
                .HasForeignKey(e => e.SafehouseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PublicImpactSnapshot ──
        modelBuilder.Entity<PublicImpactSnapshot>(entity =>
        {
            entity.ToTable("public_impact_snapshots");
            entity.HasKey(e => e.SnapshotId);
            entity.Property(e => e.SnapshotId).HasColumnName("snapshot_id");
            entity.Property(e => e.SnapshotDate).HasColumnName("snapshot_date");
            entity.Property(e => e.Headline).HasColumnName("headline").HasMaxLength(300);
            entity.Property(e => e.SummaryText).HasColumnName("summary_text").HasMaxLength(2000);
            entity.Property(e => e.MetricPayloadJson).HasColumnName("metric_payload_json").HasMaxLength(4000);
            entity.Property(e => e.IsPublished).HasColumnName("is_published");
            entity.Property(e => e.PublishedAt).HasColumnName("published_at");
        });
    }
}
