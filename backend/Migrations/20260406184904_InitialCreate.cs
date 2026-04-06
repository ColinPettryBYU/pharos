using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Pharos.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "partners",
                columns: table => new
                {
                    partner_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    partner_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    partner_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    role_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    contact_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partners", x => x.partner_id);
                });

            migrationBuilder.CreateTable(
                name: "public_impact_snapshots",
                columns: table => new
                {
                    snapshot_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    snapshot_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    headline = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    summary_text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    metric_payload_json = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_public_impact_snapshots", x => x.snapshot_id);
                });

            migrationBuilder.CreateTable(
                name: "safehouses",
                columns: table => new
                {
                    safehouse_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    safehouse_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    province = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    open_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    capacity_girls = table.Column<int>(type: "integer", nullable: false),
                    capacity_staff = table.Column<int>(type: "integer", nullable: false),
                    current_occupancy = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_safehouses", x => x.safehouse_id);
                });

            migrationBuilder.CreateTable(
                name: "social_media_posts",
                columns: table => new
                {
                    post_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    platform_post_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    post_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    day_of_week = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    post_hour = table.Column<int>(type: "integer", nullable: true),
                    post_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    media_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    caption = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    hashtags = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    num_hashtags = table.Column<int>(type: "integer", nullable: false),
                    mentions_count = table.Column<int>(type: "integer", nullable: false),
                    has_call_to_action = table.Column<bool>(type: "boolean", nullable: false),
                    call_to_action_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    content_topic = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    sentiment_tone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    caption_length = table.Column<int>(type: "integer", nullable: true),
                    features_resident_story = table.Column<bool>(type: "boolean", nullable: false),
                    campaign_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    is_boosted = table.Column<bool>(type: "boolean", nullable: false),
                    boost_budget_php = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    impressions = table.Column<int>(type: "integer", nullable: true),
                    reach = table.Column<int>(type: "integer", nullable: true),
                    likes = table.Column<int>(type: "integer", nullable: true),
                    comments = table.Column<int>(type: "integer", nullable: true),
                    shares = table.Column<int>(type: "integer", nullable: true),
                    saves = table.Column<int>(type: "integer", nullable: true),
                    click_throughs = table.Column<int>(type: "integer", nullable: true),
                    video_views = table.Column<int>(type: "integer", nullable: true),
                    engagement_rate = table.Column<decimal>(type: "numeric(10,4)", precision: 10, scale: 4, nullable: true),
                    profile_visits = table.Column<int>(type: "integer", nullable: true),
                    donation_referrals = table.Column<int>(type: "integer", nullable: true),
                    estimated_donation_value_php = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    follower_count_at_post = table.Column<int>(type: "integer", nullable: true),
                    watch_time_seconds = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    avg_view_duration_seconds = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    subscriber_count_at_post = table.Column<int>(type: "integer", nullable: true),
                    forwards = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_social_media_posts", x => x.post_id);
                });

            migrationBuilder.CreateTable(
                name: "supporters",
                columns: table => new
                {
                    supporter_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    supporter_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    organization_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    relationship_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    first_donation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    acquisition_channel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_supporters", x => x.supporter_id);
                });

            migrationBuilder.CreateTable(
                name: "partner_assignments",
                columns: table => new
                {
                    assignment_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    partner_id = table.Column<int>(type: "integer", nullable: false),
                    safehouse_id = table.Column<int>(type: "integer", nullable: true),
                    program_area = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    assignment_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    assignment_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    responsibility_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partner_assignments", x => x.assignment_id);
                    table.ForeignKey(
                        name: "FK_partner_assignments_partners_partner_id",
                        column: x => x.partner_id,
                        principalTable: "partners",
                        principalColumn: "partner_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_partner_assignments_safehouses_safehouse_id",
                        column: x => x.safehouse_id,
                        principalTable: "safehouses",
                        principalColumn: "safehouse_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "residents",
                columns: table => new
                {
                    resident_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    case_control_no = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    internal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    safehouse_id = table.Column<int>(type: "integer", nullable: false),
                    case_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    sex = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    date_of_birth = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    birth_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    place_of_birth = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    religion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    case_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sub_cat_orphaned = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_trafficked = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_child_labor = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_physical_abuse = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_sexual_abuse = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_osaec = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_cicl = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_at_risk = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_street_child = table.Column<bool>(type: "boolean", nullable: false),
                    sub_cat_child_with_hiv = table.Column<bool>(type: "boolean", nullable: false),
                    is_pwd = table.Column<bool>(type: "boolean", nullable: false),
                    pwd_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    has_special_needs = table.Column<bool>(type: "boolean", nullable: false),
                    special_needs_diagnosis = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    family_is_4ps = table.Column<bool>(type: "boolean", nullable: false),
                    family_solo_parent = table.Column<bool>(type: "boolean", nullable: false),
                    family_indigenous = table.Column<bool>(type: "boolean", nullable: false),
                    family_parent_pwd = table.Column<bool>(type: "boolean", nullable: false),
                    family_informal_settler = table.Column<bool>(type: "boolean", nullable: false),
                    date_of_admission = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    age_upon_admission = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    present_age = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    length_of_stay = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    referral_source = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    referring_agency_person = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    date_colb_registered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    date_colb_obtained = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    assigned_social_worker = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    initial_case_assessment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    date_case_study_prepared = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reintegration_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    reintegration_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    initial_risk_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    current_risk_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    date_enrolled = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    date_closed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    notes_restricted = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_residents", x => x.resident_id);
                    table.ForeignKey(
                        name: "FK_residents_safehouses_safehouse_id",
                        column: x => x.safehouse_id,
                        principalTable: "safehouses",
                        principalColumn: "safehouse_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "safehouse_monthly_metrics",
                columns: table => new
                {
                    metric_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    safehouse_id = table.Column<int>(type: "integer", nullable: false),
                    month_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    month_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    active_residents = table.Column<int>(type: "integer", nullable: false),
                    avg_education_progress = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    avg_health_score = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    process_recording_count = table.Column<int>(type: "integer", nullable: false),
                    home_visitation_count = table.Column<int>(type: "integer", nullable: false),
                    incident_count = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_safehouse_monthly_metrics", x => x.metric_id);
                    table.ForeignKey(
                        name: "FK_safehouse_monthly_metrics_safehouses_safehouse_id",
                        column: x => x.safehouse_id,
                        principalTable: "safehouses",
                        principalColumn: "safehouse_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "donations",
                columns: table => new
                {
                    donation_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    supporter_id = table.Column<int>(type: "integer", nullable: false),
                    donation_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    donation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_recurring = table.Column<bool>(type: "boolean", nullable: false),
                    campaign_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    channel_source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    currency_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    estimated_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    impact_unit = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    referral_post_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_donations", x => x.donation_id);
                    table.ForeignKey(
                        name: "FK_donations_social_media_posts_referral_post_id",
                        column: x => x.referral_post_id,
                        principalTable: "social_media_posts",
                        principalColumn: "post_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_donations_supporters_supporter_id",
                        column: x => x.supporter_id,
                        principalTable: "supporters",
                        principalColumn: "supporter_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "education_records",
                columns: table => new
                {
                    education_record_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    record_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    education_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    school_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    enrollment_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    attendance_rate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    progress_percent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    completion_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_education_records", x => x.education_record_id);
                    table.ForeignKey(
                        name: "FK_education_records_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "resident_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "health_wellbeing_records",
                columns: table => new
                {
                    health_record_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    record_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    general_health_score = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: false),
                    nutrition_score = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: false),
                    sleep_quality_score = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: false),
                    energy_level_score = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: false),
                    height_cm = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    weight_kg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    bmi = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    medical_checkup_done = table.Column<bool>(type: "boolean", nullable: false),
                    dental_checkup_done = table.Column<bool>(type: "boolean", nullable: false),
                    psychological_checkup_done = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_health_wellbeing_records", x => x.health_record_id);
                    table.ForeignKey(
                        name: "FK_health_wellbeing_records_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "resident_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "home_visitations",
                columns: table => new
                {
                    visitation_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    visit_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    social_worker = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    visit_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    location_visited = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    family_members_present = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    purpose = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    observations = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    family_cooperation_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    safety_concerns_noted = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    follow_up_needed = table.Column<bool>(type: "boolean", nullable: false),
                    follow_up_notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    visit_outcome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_home_visitations", x => x.visitation_id);
                    table.ForeignKey(
                        name: "FK_home_visitations_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "resident_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "incident_reports",
                columns: table => new
                {
                    incident_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    safehouse_id = table.Column<int>(type: "integer", nullable: false),
                    incident_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    incident_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    response_taken = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    resolved = table.Column<bool>(type: "boolean", nullable: false),
                    resolution_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    reported_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    follow_up_required = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_incident_reports", x => x.incident_id);
                    table.ForeignKey(
                        name: "FK_incident_reports_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "resident_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_incident_reports_safehouses_safehouse_id",
                        column: x => x.safehouse_id,
                        principalTable: "safehouses",
                        principalColumn: "safehouse_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "intervention_plans",
                columns: table => new
                {
                    plan_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    plan_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    plan_description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    services_provided = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    target_value = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    target_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    case_conference_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intervention_plans", x => x.plan_id);
                    table.ForeignKey(
                        name: "FK_intervention_plans_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "resident_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "process_recordings",
                columns: table => new
                {
                    recording_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    session_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    social_worker = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    session_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    session_duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    emotional_state_observed = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    emotional_state_end = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    session_narrative = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    interventions_applied = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    follow_up_actions = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    progress_noted = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    concerns_flagged = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    referral_made = table.Column<bool>(type: "boolean", nullable: false),
                    notes_restricted = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_process_recordings", x => x.recording_id);
                    table.ForeignKey(
                        name: "FK_process_recordings_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "resident_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "donation_allocations",
                columns: table => new
                {
                    allocation_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    donation_id = table.Column<int>(type: "integer", nullable: false),
                    safehouse_id = table.Column<int>(type: "integer", nullable: false),
                    program_area = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    amount_allocated = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    allocation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    allocation_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_donation_allocations", x => x.allocation_id);
                    table.ForeignKey(
                        name: "FK_donation_allocations_donations_donation_id",
                        column: x => x.donation_id,
                        principalTable: "donations",
                        principalColumn: "donation_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_donation_allocations_safehouses_safehouse_id",
                        column: x => x.safehouse_id,
                        principalTable: "safehouses",
                        principalColumn: "safehouse_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "in_kind_donation_items",
                columns: table => new
                {
                    item_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    donation_id = table.Column<int>(type: "integer", nullable: false),
                    item_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    item_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_of_measure = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    estimated_unit_value = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    intended_use = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    received_condition = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_in_kind_donation_items", x => x.item_id);
                    table.ForeignKey(
                        name: "FK_in_kind_donation_items_donations_donation_id",
                        column: x => x.donation_id,
                        principalTable: "donations",
                        principalColumn: "donation_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_donation_allocations_donation_id",
                table: "donation_allocations",
                column: "donation_id");

            migrationBuilder.CreateIndex(
                name: "IX_donation_allocations_safehouse_id",
                table: "donation_allocations",
                column: "safehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_donations_referral_post_id",
                table: "donations",
                column: "referral_post_id");

            migrationBuilder.CreateIndex(
                name: "IX_donations_supporter_id",
                table: "donations",
                column: "supporter_id");

            migrationBuilder.CreateIndex(
                name: "IX_education_records_resident_id",
                table: "education_records",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_health_wellbeing_records_resident_id",
                table: "health_wellbeing_records",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_home_visitations_resident_id",
                table: "home_visitations",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_in_kind_donation_items_donation_id",
                table: "in_kind_donation_items",
                column: "donation_id");

            migrationBuilder.CreateIndex(
                name: "IX_incident_reports_resident_id",
                table: "incident_reports",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_incident_reports_safehouse_id",
                table: "incident_reports",
                column: "safehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_intervention_plans_resident_id",
                table: "intervention_plans",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_partner_assignments_partner_id",
                table: "partner_assignments",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_partner_assignments_safehouse_id",
                table: "partner_assignments",
                column: "safehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_process_recordings_resident_id",
                table: "process_recordings",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_residents_safehouse_id",
                table: "residents",
                column: "safehouse_id");

            migrationBuilder.CreateIndex(
                name: "IX_safehouse_monthly_metrics_safehouse_id",
                table: "safehouse_monthly_metrics",
                column: "safehouse_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "donation_allocations");

            migrationBuilder.DropTable(
                name: "education_records");

            migrationBuilder.DropTable(
                name: "health_wellbeing_records");

            migrationBuilder.DropTable(
                name: "home_visitations");

            migrationBuilder.DropTable(
                name: "in_kind_donation_items");

            migrationBuilder.DropTable(
                name: "incident_reports");

            migrationBuilder.DropTable(
                name: "intervention_plans");

            migrationBuilder.DropTable(
                name: "partner_assignments");

            migrationBuilder.DropTable(
                name: "process_recordings");

            migrationBuilder.DropTable(
                name: "public_impact_snapshots");

            migrationBuilder.DropTable(
                name: "safehouse_monthly_metrics");

            migrationBuilder.DropTable(
                name: "donations");

            migrationBuilder.DropTable(
                name: "partners");

            migrationBuilder.DropTable(
                name: "residents");

            migrationBuilder.DropTable(
                name: "social_media_posts");

            migrationBuilder.DropTable(
                name: "supporters");

            migrationBuilder.DropTable(
                name: "safehouses");
        }
    }
}
