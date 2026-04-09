using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Pharos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentResponses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "comment_responses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    comment_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reply_text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_comment_responses", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_comment_responses_comment_id",
                table: "comment_responses",
                column: "comment_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "comment_responses");
        }
    }
}
