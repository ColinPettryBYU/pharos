using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using Pharos.Api.Models;

namespace Pharos.Api.Data;

/// <summary>
/// Seeds the PharosDbContext from CSV files in lighthouse_csv_v7/.
/// Reads all 17 CSVs in FK-dependency order and bulk-inserts with identity insert.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(PharosDbContext context, string csvBasePath, ILogger logger)
    {
        if (await context.Safehouses.AnyAsync())
        {
            logger.LogInformation("Database already seeded. Skipping.");
            return;
        }

        logger.LogInformation("Starting database seeding from CSV files at {Path}...", csvBasePath);

        await using var transaction = await context.Database.BeginTransactionAsync();

        try
        {
            // 1. Safehouses
            var safehouses = ReadCsv<SafehouseCsvRow>(Path.Combine(csvBasePath, "safehouses.csv"));
            foreach (var row in safehouses)
            {
                context.Safehouses.Add(new Safehouse
                {
                    SafehouseId = row.safehouse_id,
                    SafehouseCode = row.safehouse_code,
                    Name = row.name,
                    Region = row.region ?? "",
                    City = row.city ?? "",
                    Province = row.province ?? "",
                    Country = row.country ?? "",
                    OpenDate = ParseDate(row.open_date),
                    Status = row.status ?? "",
                    CapacityGirls = ParseInt(row.capacity_girls),
                    CapacityStaff = ParseInt(row.capacity_staff),
                    CurrentOccupancy = ParseInt(row.current_occupancy),
                    Notes = NullIfEmpty(row.notes)
                });
            }
            await SaveWithIdentityInsert(context, "safehouses");
            logger.LogInformation("Seeded {Count} safehouses", safehouses.Count);

            // 2. Partners
            var partners = ReadCsv<PartnerCsvRow>(Path.Combine(csvBasePath, "partners.csv"));
            foreach (var row in partners)
            {
                context.Partners.Add(new Partner
                {
                    PartnerId = row.partner_id,
                    PartnerName = row.partner_name,
                    PartnerType = row.partner_type ?? "",
                    RoleType = row.role_type ?? "",
                    ContactName = NullIfEmpty(row.contact_name),
                    Email = NullIfEmpty(row.email),
                    Phone = NullIfEmpty(row.phone),
                    Region = NullIfEmpty(row.region),
                    Status = row.status ?? "",
                    StartDate = ParseDate(row.start_date),
                    EndDate = ParseNullableDate(row.end_date),
                    Notes = NullIfEmpty(row.notes)
                });
            }
            await SaveWithIdentityInsert(context, "partners");
            logger.LogInformation("Seeded {Count} partners", partners.Count);

            // 3. Partner Assignments
            var assignments = ReadCsv<PartnerAssignmentCsvRow>(Path.Combine(csvBasePath, "partner_assignments.csv"));
            foreach (var row in assignments)
            {
                context.PartnerAssignments.Add(new PartnerAssignment
                {
                    AssignmentId = row.assignment_id,
                    PartnerId = row.partner_id,
                    SafehouseId = ParseNullableInt(row.safehouse_id),
                    ProgramArea = row.program_area ?? "",
                    AssignmentStart = ParseDate(row.assignment_start),
                    AssignmentEnd = ParseNullableDate(row.assignment_end),
                    ResponsibilityNotes = NullIfEmpty(row.responsibility_notes),
                    IsPrimary = ParseBool(row.is_primary),
                    Status = row.status ?? ""
                });
            }
            await SaveWithIdentityInsert(context, "partner_assignments");
            logger.LogInformation("Seeded {Count} partner assignments", assignments.Count);

            // 4. Supporters
            var supporters = ReadCsv<SupporterCsvRow>(Path.Combine(csvBasePath, "supporters.csv"));
            foreach (var row in supporters)
            {
                context.Supporters.Add(new Supporter
                {
                    SupporterId = row.supporter_id,
                    SupporterType = row.supporter_type ?? "",
                    DisplayName = row.display_name ?? "",
                    OrganizationName = NullIfEmpty(row.organization_name),
                    FirstName = NullIfEmpty(row.first_name),
                    LastName = NullIfEmpty(row.last_name),
                    RelationshipType = row.relationship_type ?? "",
                    Region = NullIfEmpty(row.region),
                    Country = row.country ?? "",
                    Email = NullIfEmpty(row.email),
                    Phone = NullIfEmpty(row.phone),
                    Status = row.status ?? "",
                    CreatedAt = ParseDateTime(row.created_at),
                    FirstDonationDate = ParseNullableDate(row.first_donation_date),
                    AcquisitionChannel = NullIfEmpty(row.acquisition_channel)
                });
            }
            await SaveWithIdentityInsert(context, "supporters");
            logger.LogInformation("Seeded {Count} supporters", supporters.Count);

            // 5. Social Media Posts
            var posts = ReadCsv<SocialMediaPostCsvRow>(Path.Combine(csvBasePath, "social_media_posts.csv"));
            foreach (var row in posts)
            {
                context.SocialMediaPosts.Add(new SocialMediaPost
                {
                    PostId = row.post_id,
                    Platform = row.platform ?? "",
                    PlatformPostId = NullIfEmpty(row.platform_post_id),
                    PostUrl = NullIfEmpty(row.post_url),
                    CreatedAt = ParseDateTime(row.created_at),
                    DayOfWeek = NullIfEmpty(row.day_of_week),
                    PostHour = ParseNullableInt(row.post_hour),
                    PostType = row.post_type ?? "",
                    MediaType = NullIfEmpty(row.media_type),
                    Caption = NullIfEmpty(row.caption),
                    Hashtags = NullIfEmpty(row.hashtags),
                    NumHashtags = ParseInt(row.num_hashtags),
                    MentionsCount = ParseInt(row.mentions_count),
                    HasCallToAction = ParseBool(row.has_call_to_action),
                    CallToActionType = NullIfEmpty(row.call_to_action_type),
                    ContentTopic = NullIfEmpty(row.content_topic),
                    SentimentTone = NullIfEmpty(row.sentiment_tone),
                    CaptionLength = ParseNullableInt(row.caption_length),
                    FeaturesResidentStory = ParseBool(row.features_resident_story),
                    CampaignName = NullIfEmpty(row.campaign_name),
                    IsBoosted = ParseBool(row.is_boosted),
                    BoostBudgetPhp = ParseNullableDecimal(row.boost_budget_php),
                    Impressions = ParseNullableInt(row.impressions),
                    Reach = ParseNullableInt(row.reach),
                    Likes = ParseNullableInt(row.likes),
                    Comments = ParseNullableInt(row.comments),
                    Shares = ParseNullableInt(row.shares),
                    Saves = ParseNullableInt(row.saves),
                    ClickThroughs = ParseNullableInt(row.click_throughs),
                    VideoViews = ParseNullableInt(row.video_views),
                    EngagementRate = ParseNullableDecimal(row.engagement_rate),
                    ProfileVisits = ParseNullableInt(row.profile_visits),
                    DonationReferrals = ParseNullableInt(row.donation_referrals),
                    EstimatedDonationValuePhp = ParseNullableDecimal(row.estimated_donation_value_php),
                    FollowerCountAtPost = ParseNullableInt(row.follower_count_at_post),
                    WatchTimeSeconds = ParseNullableDecimal(row.watch_time_seconds),
                    AvgViewDurationSeconds = ParseNullableDecimal(row.avg_view_duration_seconds),
                    SubscriberCountAtPost = ParseNullableInt(row.subscriber_count_at_post),
                    Forwards = ParseNullableDecimal(row.forwards)
                });
            }
            await SaveWithIdentityInsert(context, "social_media_posts");
            logger.LogInformation("Seeded {Count} social media posts", posts.Count);

            // 6. Donations
            var donations = ReadCsv<DonationCsvRow>(Path.Combine(csvBasePath, "donations.csv"));
            foreach (var row in donations)
            {
                context.Donations.Add(new Donation
                {
                    DonationId = row.donation_id,
                    SupporterId = row.supporter_id,
                    DonationType = row.donation_type ?? "",
                    DonationDate = ParseDate(row.donation_date),
                    IsRecurring = ParseBool(row.is_recurring),
                    CampaignName = NullIfEmpty(row.campaign_name),
                    ChannelSource = row.channel_source ?? "",
                    CurrencyCode = NullIfEmpty(row.currency_code),
                    Amount = ParseNullableDecimal(row.amount),
                    EstimatedValue = ParseNullableDecimal(row.estimated_value),
                    ImpactUnit = NullIfEmpty(row.impact_unit),
                    Notes = NullIfEmpty(row.notes),
                    ReferralPostId = ParseNullableInt(row.referral_post_id)
                });
            }
            await SaveWithIdentityInsert(context, "donations");
            logger.LogInformation("Seeded {Count} donations", donations.Count);

            // 7. In-Kind Donation Items
            var inkind = ReadCsv<InKindItemCsvRow>(Path.Combine(csvBasePath, "in_kind_donation_items.csv"));
            foreach (var row in inkind)
            {
                context.InKindDonationItems.Add(new InKindDonationItem
                {
                    ItemId = row.item_id,
                    DonationId = row.donation_id,
                    ItemName = row.item_name ?? "",
                    ItemCategory = row.item_category ?? "",
                    Quantity = ParseInt(row.quantity),
                    UnitOfMeasure = NullIfEmpty(row.unit_of_measure),
                    EstimatedUnitValue = ParseNullableDecimal(row.estimated_unit_value),
                    IntendedUse = NullIfEmpty(row.intended_use),
                    ReceivedCondition = NullIfEmpty(row.received_condition)
                });
            }
            await SaveWithIdentityInsert(context, "in_kind_donation_items");
            logger.LogInformation("Seeded {Count} in-kind donation items", inkind.Count);

            // 8. Donation Allocations
            var allocations = ReadCsv<AllocationCsvRow>(Path.Combine(csvBasePath, "donation_allocations.csv"));
            foreach (var row in allocations)
            {
                context.DonationAllocations.Add(new DonationAllocation
                {
                    AllocationId = row.allocation_id,
                    DonationId = row.donation_id,
                    SafehouseId = row.safehouse_id,
                    ProgramArea = row.program_area ?? "",
                    AmountAllocated = ParseDecimal(row.amount_allocated),
                    AllocationDate = ParseDate(row.allocation_date),
                    AllocationNotes = NullIfEmpty(row.allocation_notes)
                });
            }
            await SaveWithIdentityInsert(context, "donation_allocations");
            logger.LogInformation("Seeded {Count} donation allocations", allocations.Count);

            // 9. Residents
            var residents = ReadCsv<ResidentCsvRow>(Path.Combine(csvBasePath, "residents.csv"));
            foreach (var row in residents)
            {
                context.Residents.Add(new Resident
                {
                    ResidentId = row.resident_id,
                    CaseControlNo = row.case_control_no ?? "",
                    InternalCode = row.internal_code ?? "",
                    SafehouseId = row.safehouse_id,
                    CaseStatus = row.case_status ?? "",
                    Sex = row.sex ?? "",
                    DateOfBirth = ParseDate(row.date_of_birth),
                    BirthStatus = NullIfEmpty(row.birth_status),
                    PlaceOfBirth = NullIfEmpty(row.place_of_birth),
                    Religion = NullIfEmpty(row.religion),
                    CaseCategory = row.case_category ?? "",
                    SubCatOrphaned = ParseBool(row.sub_cat_orphaned),
                    SubCatTrafficked = ParseBool(row.sub_cat_trafficked),
                    SubCatChildLabor = ParseBool(row.sub_cat_child_labor),
                    SubCatPhysicalAbuse = ParseBool(row.sub_cat_physical_abuse),
                    SubCatSexualAbuse = ParseBool(row.sub_cat_sexual_abuse),
                    SubCatOsaec = ParseBool(row.sub_cat_osaec),
                    SubCatCicl = ParseBool(row.sub_cat_cicl),
                    SubCatAtRisk = ParseBool(row.sub_cat_at_risk),
                    SubCatStreetChild = ParseBool(row.sub_cat_street_child),
                    SubCatChildWithHiv = ParseBool(row.sub_cat_child_with_hiv),
                    IsPwd = ParseBool(row.is_pwd),
                    PwdType = NullIfEmpty(row.pwd_type),
                    HasSpecialNeeds = ParseBool(row.has_special_needs),
                    SpecialNeedsDiagnosis = NullIfEmpty(row.special_needs_diagnosis),
                    FamilyIs4ps = ParseBool(row.family_is_4ps),
                    FamilySoloParent = ParseBool(row.family_solo_parent),
                    FamilyIndigenous = ParseBool(row.family_indigenous),
                    FamilyParentPwd = ParseBool(row.family_parent_pwd),
                    FamilyInformalSettler = ParseBool(row.family_informal_settler),
                    DateOfAdmission = ParseDate(row.date_of_admission),
                    AgeUponAdmission = NullIfEmpty(row.age_upon_admission),
                    PresentAge = NullIfEmpty(row.present_age),
                    LengthOfStay = NullIfEmpty(row.length_of_stay),
                    ReferralSource = NullIfEmpty(row.referral_source),
                    ReferringAgencyPerson = NullIfEmpty(row.referring_agency_person),
                    DateColbRegistered = ParseNullableDate(row.date_colb_registered),
                    DateColbObtained = ParseNullableDate(row.date_colb_obtained),
                    AssignedSocialWorker = NullIfEmpty(row.assigned_social_worker),
                    InitialCaseAssessment = NullIfEmpty(row.initial_case_assessment),
                    DateCaseStudyPrepared = ParseNullableDate(row.date_case_study_prepared),
                    ReintegrationType = NullIfEmpty(row.reintegration_type),
                    ReintegrationStatus = NullIfEmpty(row.reintegration_status),
                    InitialRiskLevel = NullIfEmpty(row.initial_risk_level),
                    CurrentRiskLevel = NullIfEmpty(row.current_risk_level),
                    DateEnrolled = ParseDate(row.date_enrolled),
                    DateClosed = ParseNullableDate(row.date_closed),
                    CreatedAt = ParseDateTime(row.created_at),
                    NotesRestricted = NullIfEmpty(row.notes_restricted)
                });
            }
            await SaveWithIdentityInsert(context, "residents");
            logger.LogInformation("Seeded {Count} residents", residents.Count);

            // 10. Process Recordings (largest table - batch insert)
            var recordings = ReadCsv<ProcessRecordingCsvRow>(Path.Combine(csvBasePath, "process_recordings.csv"));
            var recordingBatch = new List<ProcessRecording>();
            foreach (var row in recordings)
            {
                recordingBatch.Add(new ProcessRecording
                {
                    RecordingId = row.recording_id,
                    ResidentId = row.resident_id,
                    SessionDate = ParseDate(row.session_date),
                    SocialWorker = row.social_worker ?? "",
                    SessionType = row.session_type ?? "",
                    SessionDurationMinutes = ParseInt(row.session_duration_minutes),
                    EmotionalStateObserved = NullIfEmpty(row.emotional_state_observed),
                    EmotionalStateEnd = NullIfEmpty(row.emotional_state_end),
                    SessionNarrative = NullIfEmpty(row.session_narrative),
                    InterventionsApplied = NullIfEmpty(row.interventions_applied),
                    FollowUpActions = NullIfEmpty(row.follow_up_actions),
                    ProgressNoted = NullIfEmpty(row.progress_noted),
                    ConcernsFlagged = NullIfEmpty(row.concerns_flagged),
                    ReferralMade = ParseBool(row.referral_made),
                    NotesRestricted = NullIfEmpty(row.notes_restricted)
                });
            }
            context.ProcessRecordings.AddRange(recordingBatch);
            await SaveWithIdentityInsert(context, "process_recordings");
            logger.LogInformation("Seeded {Count} process recordings", recordings.Count);

            // 11. Home Visitations
            var visitations = ReadCsv<HomeVisitationCsvRow>(Path.Combine(csvBasePath, "home_visitations.csv"));
            var visitBatch = new List<HomeVisitation>();
            foreach (var row in visitations)
            {
                visitBatch.Add(new HomeVisitation
                {
                    VisitationId = row.visitation_id,
                    ResidentId = row.resident_id,
                    VisitDate = ParseDate(row.visit_date),
                    SocialWorker = row.social_worker ?? "",
                    VisitType = row.visit_type ?? "",
                    LocationVisited = NullIfEmpty(row.location_visited),
                    FamilyMembersPresent = NullIfEmpty(row.family_members_present),
                    Purpose = NullIfEmpty(row.purpose),
                    Observations = NullIfEmpty(row.observations),
                    FamilyCooperationLevel = NullIfEmpty(row.family_cooperation_level),
                    SafetyConcernsNoted = NullIfEmpty(row.safety_concerns_noted),
                    FollowUpNeeded = ParseBool(row.follow_up_needed),
                    FollowUpNotes = NullIfEmpty(row.follow_up_notes),
                    VisitOutcome = NullIfEmpty(row.visit_outcome)
                });
            }
            context.HomeVisitations.AddRange(visitBatch);
            await SaveWithIdentityInsert(context, "home_visitations");
            logger.LogInformation("Seeded {Count} home visitations", visitations.Count);

            // 12. Education Records
            var eduRecords = ReadCsv<EducationCsvRow>(Path.Combine(csvBasePath, "education_records.csv"));
            foreach (var row in eduRecords)
            {
                context.EducationRecords.Add(new EducationRecord
                {
                    EducationRecordId = row.education_record_id,
                    ResidentId = row.resident_id,
                    RecordDate = ParseDate(row.record_date),
                    EducationLevel = row.education_level ?? "",
                    SchoolName = NullIfEmpty(row.school_name),
                    EnrollmentStatus = NullIfEmpty(row.enrollment_status),
                    AttendanceRate = ParseNullableDecimal(row.attendance_rate),
                    ProgressPercent = ParseNullableDecimal(row.progress_percent),
                    CompletionStatus = NullIfEmpty(row.completion_status),
                    Notes = NullIfEmpty(row.notes)
                });
            }
            await SaveWithIdentityInsert(context, "education_records");
            logger.LogInformation("Seeded {Count} education records", eduRecords.Count);

            // 13. Health Wellbeing Records
            var healthRecords = ReadCsv<HealthCsvRow>(Path.Combine(csvBasePath, "health_wellbeing_records.csv"));
            foreach (var row in healthRecords)
            {
                context.HealthWellbeingRecords.Add(new HealthWellbeingRecord
                {
                    HealthRecordId = row.health_record_id,
                    ResidentId = row.resident_id,
                    RecordDate = ParseDate(row.record_date),
                    GeneralHealthScore = ParseDecimal(row.general_health_score),
                    NutritionScore = ParseDecimal(row.nutrition_score),
                    SleepQualityScore = ParseDecimal(row.sleep_quality_score),
                    EnergyLevelScore = ParseDecimal(row.energy_level_score),
                    HeightCm = ParseNullableDecimal(row.height_cm),
                    WeightKg = ParseNullableDecimal(row.weight_kg),
                    Bmi = ParseNullableDecimal(row.bmi),
                    MedicalCheckupDone = ParseBool(row.medical_checkup_done),
                    DentalCheckupDone = ParseBool(row.dental_checkup_done),
                    PsychologicalCheckupDone = ParseBool(row.psychological_checkup_done),
                    Notes = NullIfEmpty(row.notes)
                });
            }
            await SaveWithIdentityInsert(context, "health_wellbeing_records");
            logger.LogInformation("Seeded {Count} health records", healthRecords.Count);

            // 14. Intervention Plans
            var plans = ReadCsv<InterventionPlanCsvRow>(Path.Combine(csvBasePath, "intervention_plans.csv"));
            foreach (var row in plans)
            {
                context.InterventionPlans.Add(new InterventionPlan
                {
                    PlanId = row.plan_id,
                    ResidentId = row.resident_id,
                    PlanCategory = row.plan_category ?? "",
                    PlanDescription = NullIfEmpty(row.plan_description),
                    ServicesProvided = NullIfEmpty(row.services_provided),
                    TargetValue = ParseNullableDecimal(row.target_value),
                    TargetDate = ParseNullableDate(row.target_date),
                    Status = row.status ?? "",
                    CaseConferenceDate = ParseNullableDate(row.case_conference_date),
                    CreatedAt = ParseDateTime(row.created_at),
                    UpdatedAt = ParseDateTime(row.updated_at)
                });
            }
            await SaveWithIdentityInsert(context, "intervention_plans");
            logger.LogInformation("Seeded {Count} intervention plans", plans.Count);

            // 15. Incident Reports
            var incidents = ReadCsv<IncidentCsvRow>(Path.Combine(csvBasePath, "incident_reports.csv"));
            foreach (var row in incidents)
            {
                context.IncidentReports.Add(new IncidentReport
                {
                    IncidentId = row.incident_id,
                    ResidentId = row.resident_id,
                    SafehouseId = row.safehouse_id,
                    IncidentDate = ParseDate(row.incident_date),
                    IncidentType = row.incident_type ?? "",
                    Severity = row.severity ?? "",
                    Description = NullIfEmpty(row.description),
                    ResponseTaken = NullIfEmpty(row.response_taken),
                    Resolved = ParseBool(row.resolved),
                    ResolutionDate = ParseNullableDate(row.resolution_date),
                    ReportedBy = NullIfEmpty(row.reported_by),
                    FollowUpRequired = ParseBool(row.follow_up_required)
                });
            }
            await SaveWithIdentityInsert(context, "incident_reports");
            logger.LogInformation("Seeded {Count} incident reports", incidents.Count);

            // 16. Safehouse Monthly Metrics
            var metrics = ReadCsv<MetricCsvRow>(Path.Combine(csvBasePath, "safehouse_monthly_metrics.csv"));
            foreach (var row in metrics)
            {
                context.SafehouseMonthlyMetrics.Add(new SafehouseMonthlyMetric
                {
                    MetricId = row.metric_id,
                    SafehouseId = row.safehouse_id,
                    MonthStart = ParseDate(row.month_start),
                    MonthEnd = ParseDate(row.month_end),
                    ActiveResidents = ParseInt(row.active_residents),
                    AvgEducationProgress = ParseNullableDecimal(row.avg_education_progress),
                    AvgHealthScore = ParseNullableDecimal(row.avg_health_score),
                    ProcessRecordingCount = ParseInt(row.process_recording_count),
                    HomeVisitationCount = ParseInt(row.home_visitation_count),
                    IncidentCount = ParseInt(row.incident_count),
                    Notes = NullIfEmpty(row.notes)
                });
            }
            await SaveWithIdentityInsert(context, "safehouse_monthly_metrics");
            logger.LogInformation("Seeded {Count} safehouse monthly metrics", metrics.Count);

            // 17. Public Impact Snapshots
            var snapshots = ReadCsv<SnapshotCsvRow>(Path.Combine(csvBasePath, "public_impact_snapshots.csv"));
            foreach (var row in snapshots)
            {
                context.PublicImpactSnapshots.Add(new PublicImpactSnapshot
                {
                    SnapshotId = row.snapshot_id,
                    SnapshotDate = ParseDate(row.snapshot_date),
                    Headline = row.headline ?? "",
                    SummaryText = NullIfEmpty(row.summary_text),
                    MetricPayloadJson = NullIfEmpty(row.metric_payload_json),
                    IsPublished = ParseBool(row.is_published),
                    PublishedAt = ParseNullableDate(row.published_at)
                });
            }
            await SaveWithIdentityInsert(context, "public_impact_snapshots");
            logger.LogInformation("Seeded {Count} public impact snapshots", snapshots.Count);

            await transaction.CommitAsync();
            logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding database. Rolling back.");
            await transaction.RollbackAsync();
            throw;
        }
    }

    public static async Task SeedMLPredictionsAsync(PharosDbContext context, string mlDir, ILogger logger)
    {
        if (!await context.InterventionEffectiveness.AnyAsync())
        {
            logger.LogInformation("Seeding intervention_effectiveness from notebook results...");
            var rows = new[]
            {
                // Intervention categories
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Psychosocial",   Coefficient = 0.0001, PValue = 0.0624, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Legal",          Coefficient = 0.0,    PValue = 0.9729, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Reintegration",  Coefficient = 0.0,    PValue = 0.4061, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Psychosocial",   Coefficient = 0.0001, PValue = 0.0967, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Legal",          Coefficient = 0.0001, PValue = 0.0974, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Reintegration",  Coefficient = -0.0001,PValue = 0.7225, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Psychosocial",   Coefficient = 0.0,    PValue = 0.7032, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Legal",          Coefficient = 0.0,    PValue = 0.7328, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Reintegration",  Coefficient = 0.0,    PValue = 0.7289, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Safety",         Coefficient = 0.0002, PValue = 0.0512, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Safety",         Coefficient = 0.0,    PValue = 0.3841, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Safety",         Coefficient = 0.0001, PValue = 0.1523, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Education",      Coefficient = 0.0,    PValue = 0.4210, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Education",      Coefficient = 0.0003, PValue = 0.0389, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Education",      Coefficient = 0.0,    PValue = 0.5612, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Physical Health", Coefficient = 0.0004, PValue = 0.0281, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Physical Health", Coefficient = 0.0,    PValue = 0.6134, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Physical Health", Coefficient = 0.0001, PValue = 0.2047, Significant = false },
                // Control variables (key drivers)
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Session Frequency",  Coefficient = 0.0012, PValue = 0.1420, Significant = false },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Session Frequency",  Coefficient = 0.0031, PValue = 0.0420, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Session Frequency",  Coefficient = 0.0018, PValue = 0.0380, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_health_score",     Intervention = "Program Duration",   Coefficient = 0.0008, PValue = 0.0350, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_edu_progress",     Intervention = "Program Duration",   Coefficient = 0.0045, PValue = 0.0210, Significant = true },
                new InterventionEffectivenessRow { Outcome = "delta_pct_positive_end", Intervention = "Program Duration",   Coefficient = 0.0005, PValue = 0.2100, Significant = false },
            };
            context.InterventionEffectiveness.AddRange(rows);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} intervention_effectiveness rows.", rows.Length);
        }
        else
        {
            logger.LogInformation("intervention_effectiveness already populated, skipping.");
        }
    }

    // ── Helpers ──

    private static List<T> ReadCsv<T>(string filePath)
    {
        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            HeaderValidated = null,
            BadDataFound = null,
            TrimOptions = TrimOptions.Trim
        });
        return csv.GetRecords<T>().ToList();
    }

    private static async Task SaveWithIdentityInsert(PharosDbContext context, string tableName)
    {
        // For PostgreSQL, we save normally (PKs are explicitly set on the entities).
        // After saving, reset the sequence to max(id) + 1 so future inserts work.
        await context.SaveChangesAsync();

        // Find the primary key column (convention: tableName without 's' + _id, or just id)
        var pkColumn = tableName switch
        {
            "safehouses" => "safehouse_id",
            "partners" => "partner_id",
            "partner_assignments" => "assignment_id",
            "supporters" => "supporter_id",
            "donations" => "donation_id",
            "in_kind_donation_items" => "item_id",
            "donation_allocations" => "allocation_id",
            "residents" => "resident_id",
            "process_recordings" => "recording_id",
            "home_visitations" => "visitation_id",
            "education_records" => "education_record_id",
            "health_wellbeing_records" => "health_record_id",
            "intervention_plans" => "plan_id",
            "incident_reports" => "incident_id",
            "social_media_posts" => "post_id",
            "safehouse_monthly_metrics" => "metric_id",
            "public_impact_snapshots" => "snapshot_id",
            _ => "id"
        };

        // Reset the PostgreSQL sequence to the max value so future inserts auto-increment correctly
        var seqName = $"{tableName}_{pkColumn}_seq";
        await context.Database.ExecuteSqlRawAsync(
            $"SELECT setval(pg_get_serial_sequence('{tableName}', '{pkColumn}'), COALESCE(MAX(\"{pkColumn}\"), 1)) FROM \"{tableName}\"");
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool ParseBool(string? value) =>
        string.Equals(value?.Trim(), "True", StringComparison.OrdinalIgnoreCase);

    private static int ParseInt(string? value) =>
        int.TryParse(value?.Trim(), out var result) ? result : 0;

    private static int? ParseNullableInt(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : int.TryParse(value.Trim().Split('.')[0], out var r) ? r : null;

    private static decimal ParseDecimal(string? value) =>
        decimal.TryParse(value?.Trim(), CultureInfo.InvariantCulture, out var result) ? result : 0;

    private static decimal? ParseNullableDecimal(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : decimal.TryParse(value.Trim(), CultureInfo.InvariantCulture, out var r) ? r : null;

    private static DateTime ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Utc);
        var trimmed = value.Trim();
        const DateTimeStyles utcStyles = DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal;
        if (DateTime.TryParse(trimmed, CultureInfo.InvariantCulture, utcStyles, out var dt)) return dt;
        if (DateTime.TryParseExact(trimmed, "yyyy-MM-dd", CultureInfo.InvariantCulture, utcStyles, out dt)) return dt;
        return DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Utc);
    }

    private static DateTime? ParseNullableDate(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : ParseDate(value) == DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Utc) ? null : ParseDate(value);

    private static DateTime ParseDateTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DateTime.UtcNow;
        const DateTimeStyles utcStyles = DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal;
        if (DateTime.TryParse(value.Trim(), CultureInfo.InvariantCulture, utcStyles, out var dt)) return dt;
        return DateTime.UtcNow;
    }

    // ── CSV Row Models ──

    #pragma warning disable CS8618

    public class SafehouseCsvRow { public int safehouse_id { get; set; } public string safehouse_code { get; set; } public string name { get; set; } public string? region { get; set; } public string? city { get; set; } public string? province { get; set; } public string? country { get; set; } public string open_date { get; set; } public string? status { get; set; } public string? capacity_girls { get; set; } public string? capacity_staff { get; set; } public string? current_occupancy { get; set; } public string? notes { get; set; } }

    public class PartnerCsvRow { public int partner_id { get; set; } public string partner_name { get; set; } public string? partner_type { get; set; } public string? role_type { get; set; } public string? contact_name { get; set; } public string? email { get; set; } public string? phone { get; set; } public string? region { get; set; } public string? status { get; set; } public string start_date { get; set; } public string? end_date { get; set; } public string? notes { get; set; } }

    public class PartnerAssignmentCsvRow { public int assignment_id { get; set; } public int partner_id { get; set; } public string? safehouse_id { get; set; } public string? program_area { get; set; } public string assignment_start { get; set; } public string? assignment_end { get; set; } public string? responsibility_notes { get; set; } public string? is_primary { get; set; } public string? status { get; set; } }

    public class SupporterCsvRow { public int supporter_id { get; set; } public string? supporter_type { get; set; } public string? display_name { get; set; } public string? organization_name { get; set; } public string? first_name { get; set; } public string? last_name { get; set; } public string? relationship_type { get; set; } public string? region { get; set; } public string? country { get; set; } public string? email { get; set; } public string? phone { get; set; } public string? status { get; set; } public string created_at { get; set; } public string? first_donation_date { get; set; } public string? acquisition_channel { get; set; } }

    public class SocialMediaPostCsvRow { public int post_id { get; set; } public string? platform { get; set; } public string? platform_post_id { get; set; } public string? post_url { get; set; } public string created_at { get; set; } public string? day_of_week { get; set; } public string? post_hour { get; set; } public string? post_type { get; set; } public string? media_type { get; set; } public string? caption { get; set; } public string? hashtags { get; set; } public string? num_hashtags { get; set; } public string? mentions_count { get; set; } public string? has_call_to_action { get; set; } public string? call_to_action_type { get; set; } public string? content_topic { get; set; } public string? sentiment_tone { get; set; } public string? caption_length { get; set; } public string? features_resident_story { get; set; } public string? campaign_name { get; set; } public string? is_boosted { get; set; } public string? boost_budget_php { get; set; } public string? impressions { get; set; } public string? reach { get; set; } public string? likes { get; set; } public string? comments { get; set; } public string? shares { get; set; } public string? saves { get; set; } public string? click_throughs { get; set; } public string? video_views { get; set; } public string? engagement_rate { get; set; } public string? profile_visits { get; set; } public string? donation_referrals { get; set; } public string? estimated_donation_value_php { get; set; } public string? follower_count_at_post { get; set; } public string? watch_time_seconds { get; set; } public string? avg_view_duration_seconds { get; set; } public string? subscriber_count_at_post { get; set; } public string? forwards { get; set; } }

    public class DonationCsvRow { public int donation_id { get; set; } public int supporter_id { get; set; } public string? donation_type { get; set; } public string donation_date { get; set; } public string? is_recurring { get; set; } public string? campaign_name { get; set; } public string? channel_source { get; set; } public string? currency_code { get; set; } public string? amount { get; set; } public string? estimated_value { get; set; } public string? impact_unit { get; set; } public string? notes { get; set; } public string? referral_post_id { get; set; } }

    public class InKindItemCsvRow { public int item_id { get; set; } public int donation_id { get; set; } public string? item_name { get; set; } public string? item_category { get; set; } public string? quantity { get; set; } public string? unit_of_measure { get; set; } public string? estimated_unit_value { get; set; } public string? intended_use { get; set; } public string? received_condition { get; set; } }

    public class AllocationCsvRow { public int allocation_id { get; set; } public int donation_id { get; set; } public int safehouse_id { get; set; } public string? program_area { get; set; } public string amount_allocated { get; set; } public string allocation_date { get; set; } public string? allocation_notes { get; set; } }

    public class ResidentCsvRow { public int resident_id { get; set; } public string? case_control_no { get; set; } public string? internal_code { get; set; } public int safehouse_id { get; set; } public string? case_status { get; set; } public string? sex { get; set; } public string date_of_birth { get; set; } public string? birth_status { get; set; } public string? place_of_birth { get; set; } public string? religion { get; set; } public string? case_category { get; set; } public string? sub_cat_orphaned { get; set; } public string? sub_cat_trafficked { get; set; } public string? sub_cat_child_labor { get; set; } public string? sub_cat_physical_abuse { get; set; } public string? sub_cat_sexual_abuse { get; set; } public string? sub_cat_osaec { get; set; } public string? sub_cat_cicl { get; set; } public string? sub_cat_at_risk { get; set; } public string? sub_cat_street_child { get; set; } public string? sub_cat_child_with_hiv { get; set; } public string? is_pwd { get; set; } public string? pwd_type { get; set; } public string? has_special_needs { get; set; } public string? special_needs_diagnosis { get; set; } public string? family_is_4ps { get; set; } public string? family_solo_parent { get; set; } public string? family_indigenous { get; set; } public string? family_parent_pwd { get; set; } public string? family_informal_settler { get; set; } public string date_of_admission { get; set; } public string? age_upon_admission { get; set; } public string? present_age { get; set; } public string? length_of_stay { get; set; } public string? referral_source { get; set; } public string? referring_agency_person { get; set; } public string? date_colb_registered { get; set; } public string? date_colb_obtained { get; set; } public string? assigned_social_worker { get; set; } public string? initial_case_assessment { get; set; } public string? date_case_study_prepared { get; set; } public string? reintegration_type { get; set; } public string? reintegration_status { get; set; } public string? initial_risk_level { get; set; } public string? current_risk_level { get; set; } public string date_enrolled { get; set; } public string? date_closed { get; set; } public string created_at { get; set; } public string? notes_restricted { get; set; } }

    public class ProcessRecordingCsvRow { public int recording_id { get; set; } public int resident_id { get; set; } public string session_date { get; set; } public string? social_worker { get; set; } public string? session_type { get; set; } public string? session_duration_minutes { get; set; } public string? emotional_state_observed { get; set; } public string? emotional_state_end { get; set; } public string? session_narrative { get; set; } public string? interventions_applied { get; set; } public string? follow_up_actions { get; set; } public string? progress_noted { get; set; } public string? concerns_flagged { get; set; } public string? referral_made { get; set; } public string? notes_restricted { get; set; } }

    public class HomeVisitationCsvRow { public int visitation_id { get; set; } public int resident_id { get; set; } public string visit_date { get; set; } public string? social_worker { get; set; } public string? visit_type { get; set; } public string? location_visited { get; set; } public string? family_members_present { get; set; } public string? purpose { get; set; } public string? observations { get; set; } public string? family_cooperation_level { get; set; } public string? safety_concerns_noted { get; set; } public string? follow_up_needed { get; set; } public string? follow_up_notes { get; set; } public string? visit_outcome { get; set; } }

    public class EducationCsvRow { public int education_record_id { get; set; } public int resident_id { get; set; } public string record_date { get; set; } public string? education_level { get; set; } public string? school_name { get; set; } public string? enrollment_status { get; set; } public string? attendance_rate { get; set; } public string? progress_percent { get; set; } public string? completion_status { get; set; } public string? notes { get; set; } }

    public class HealthCsvRow { public int health_record_id { get; set; } public int resident_id { get; set; } public string record_date { get; set; } public string general_health_score { get; set; } public string nutrition_score { get; set; } public string sleep_quality_score { get; set; } public string energy_level_score { get; set; } public string? height_cm { get; set; } public string? weight_kg { get; set; } public string? bmi { get; set; } public string? medical_checkup_done { get; set; } public string? dental_checkup_done { get; set; } public string? psychological_checkup_done { get; set; } public string? notes { get; set; } }

    public class InterventionPlanCsvRow { public int plan_id { get; set; } public int resident_id { get; set; } public string? plan_category { get; set; } public string? plan_description { get; set; } public string? services_provided { get; set; } public string? target_value { get; set; } public string? target_date { get; set; } public string? status { get; set; } public string? case_conference_date { get; set; } public string created_at { get; set; } public string updated_at { get; set; } }

    public class IncidentCsvRow { public int incident_id { get; set; } public int resident_id { get; set; } public int safehouse_id { get; set; } public string incident_date { get; set; } public string? incident_type { get; set; } public string? severity { get; set; } public string? description { get; set; } public string? response_taken { get; set; } public string? resolved { get; set; } public string? resolution_date { get; set; } public string? reported_by { get; set; } public string? follow_up_required { get; set; } }

    public class MetricCsvRow { public int metric_id { get; set; } public int safehouse_id { get; set; } public string month_start { get; set; } public string month_end { get; set; } public string? active_residents { get; set; } public string? avg_education_progress { get; set; } public string? avg_health_score { get; set; } public string? process_recording_count { get; set; } public string? home_visitation_count { get; set; } public string? incident_count { get; set; } public string? notes { get; set; } }

    public class SnapshotCsvRow { public int snapshot_id { get; set; } public string snapshot_date { get; set; } public string? headline { get; set; } public string? summary_text { get; set; } public string? metric_payload_json { get; set; } public string? is_published { get; set; } public string? published_at { get; set; } }

    #pragma warning restore CS8618
}
