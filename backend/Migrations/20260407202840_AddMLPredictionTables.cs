using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Pharos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMLPredictionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "donor_churn_scores",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    supporter_id = table.Column<int>(type: "integer", nullable: false),
                    churn_risk_score = table.Column<double>(type: "double precision", nullable: false),
                    risk_tier = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    computed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_donor_churn_scores", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "intervention_effectiveness",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    outcome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    intervention = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    coefficient = table.Column<double>(type: "double precision", nullable: false),
                    p_value = table.Column<double>(type: "double precision", nullable: false),
                    significant = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intervention_effectiveness", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ml_social_media_recommendations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    post_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    recommended_hour = table.Column<int>(type: "integer", nullable: false),
                    recommended_day = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    include_resident_story = table.Column<bool>(type: "boolean", nullable: false),
                    include_call_to_action = table.Column<bool>(type: "boolean", nullable: false),
                    predicted_donations = table.Column<double>(type: "double precision", nullable: false),
                    computed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ml_social_media_recommendations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "resident_readiness_scores",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    readiness_score = table.Column<double>(type: "double precision", nullable: false),
                    readiness_tier = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    computed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resident_readiness_scores", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "donor_churn_scores");

            migrationBuilder.DropTable(
                name: "intervention_effectiveness");

            migrationBuilder.DropTable(
                name: "ml_social_media_recommendations");

            migrationBuilder.DropTable(
                name: "resident_readiness_scores");
        }
    }
}
