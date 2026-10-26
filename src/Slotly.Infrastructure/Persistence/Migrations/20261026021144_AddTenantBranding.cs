using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Slotly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantBranding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "logo_url",
                table: "tenants",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "primary_color",
                table: "tenants",
                type: "character varying(7)",
                maxLength: 7,
                nullable: false,
                defaultValue: "#5145CD");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "logo_url",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "primary_color",
                table: "tenants");
        }
    }
}
