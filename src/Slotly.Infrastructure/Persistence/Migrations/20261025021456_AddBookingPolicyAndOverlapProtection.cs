using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Slotly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingPolicyAndOverlapProtection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "cancellation_window_hours",
                table: "tenants",
                type: "integer",
                nullable: false,
                defaultValue: 24);

            migrationBuilder.AddColumn<string>(
                name: "time_zone_id",
                table: "tenants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "UTC");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "blocked_until",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE bookings SET blocked_until = ends_at;");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "blocked_until",
                table: "bookings",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");
            migrationBuilder.Sql(
                """
                ALTER TABLE bookings
                ADD CONSTRAINT ex_bookings_staff_time_no_overlap
                EXCLUDE USING gist (
                    tenant_id WITH =,
                    staff_id WITH =,
                    tstzrange(starts_at, blocked_until, '[)') WITH &&
                )
                WHERE (status IN ('Pending', 'Confirmed'));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE bookings DROP CONSTRAINT IF EXISTS ex_bookings_staff_time_no_overlap;");

            migrationBuilder.DropColumn(
                name: "cancellation_window_hours",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "time_zone_id",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "blocked_until",
                table: "bookings");
        }
    }
}
