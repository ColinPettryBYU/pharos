using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Pharos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddResidentElevatedRiskScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "resident_elevated_risk_scores",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    resident_id = table.Column<int>(type: "integer", nullable: false),
                    risk_score = table.Column<double>(type: "double precision", nullable: false),
                    risk_tier = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    top_factors = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    computed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_resident_elevated_risk_scores", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "resident_elevated_risk_scores");
        }
    }
}
