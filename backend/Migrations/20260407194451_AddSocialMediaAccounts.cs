using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Pharos.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSocialMediaAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "social_media_accounts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    account_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    account_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    encrypted_access_token = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    encrypted_refresh_token = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    connected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    token_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    page_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_social_media_accounts", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "social_media_accounts");
        }
    }
}
