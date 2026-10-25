using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Slotly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStripePayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "deposit_percentage",
                table: "tenants",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "online_payments_enabled",
                table: "tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "checkout_session_id",
                table: "payments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "payment_intent_id",
                table: "payments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "processed_webhook_events",
                columns: table => new
                {
                    event_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    event_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    processed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_processed_webhook_events", x => x.event_id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_payments_checkout_session_id",
                table: "payments",
                column: "checkout_session_id",
                unique: true,
                filter: "checkout_session_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_payments_payment_intent_id",
                table: "payments",
                column: "payment_intent_id",
                unique: true,
                filter: "payment_intent_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "processed_webhook_events");

            migrationBuilder.DropIndex(
                name: "ix_payments_checkout_session_id",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "ix_payments_payment_intent_id",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "deposit_percentage",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "online_payments_enabled",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "checkout_session_id",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "payment_intent_id",
                table: "payments");
        }
    }
}
