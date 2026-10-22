using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Slotly.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialDomainSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tenants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tenants", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "customers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customers", x => x.id);
                    table.UniqueConstraint("ak_customers_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_customers_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "services",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    buffer_minutes = table.Column<int>(type: "integer", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    price_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    price_currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_services", x => x.id);
                    table.UniqueConstraint("ak_services_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_services_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                    table.UniqueConstraint("ak_users_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_users_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "staff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_staff", x => x.id);
                    table.UniqueConstraint("ak_staff_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_staff_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_staff_users_tenant_id_user_id",
                        columns: x => new { x.tenant_id, x.user_id },
                        principalTable: "users",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "bookings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    cancellation_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    version = table.Column<Guid>(type: "uuid", nullable: false),
                    ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bookings", x => x.id);
                    table.UniqueConstraint("ak_bookings_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_bookings_customers_tenant_id_customer_id",
                        columns: x => new { x.tenant_id, x.customer_id },
                        principalTable: "customers",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_bookings_services_tenant_id_service_id",
                        columns: x => new { x.tenant_id, x.service_id },
                        principalTable: "services",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_bookings_staff_tenant_id_staff_id",
                        columns: x => new { x.tenant_id, x.staff_id },
                        principalTable: "staff",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_bookings_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "time_off",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_time_off", x => x.id);
                    table.UniqueConstraint("ak_time_off_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_time_off_staff_tenant_id_staff_id",
                        columns: x => new { x.tenant_id, x.staff_id },
                        principalTable: "staff",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_time_off_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "working_hours",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    ends_at = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    starts_at = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_working_hours", x => x.id);
                    table.UniqueConstraint("ak_working_hours_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_working_hours_staff_tenant_id_staff_id",
                        columns: x => new { x.tenant_id, x.staff_id },
                        principalTable: "staff",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_working_hours_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    booking_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    provider_reference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_payments", x => x.id);
                    table.UniqueConstraint("ak_payments_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_payments_bookings_tenant_id_booking_id",
                        columns: x => new { x.tenant_id, x.booking_id },
                        principalTable: "bookings",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_payments_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "working_hours_breaks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    working_hours_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ends_at = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    starts_at = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_working_hours_breaks", x => x.id);
                    table.UniqueConstraint("ak_working_hours_breaks_tenant_id_id", x => new { x.tenant_id, x.id });
                    table.ForeignKey(
                        name: "fk_working_hours_breaks_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_working_hours_breaks_working_hours_tenant_id_working_hours_",
                        columns: x => new { x.tenant_id, x.working_hours_id },
                        principalTable: "working_hours",
                        principalColumns: new[] { "tenant_id", "id" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bookings_tenant_id_customer_id",
                table: "bookings",
                columns: new[] { "tenant_id", "customer_id" });

            migrationBuilder.CreateIndex(
                name: "ix_bookings_tenant_id_service_id",
                table: "bookings",
                columns: new[] { "tenant_id", "service_id" });

            migrationBuilder.CreateIndex(
                name: "ix_bookings_tenant_id_staff_id_starts_at_status",
                table: "bookings",
                columns: new[] { "tenant_id", "staff_id", "starts_at", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_customers_tenant_id_email",
                table: "customers",
                columns: new[] { "tenant_id", "email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_customers_tenant_id_name",
                table: "customers",
                columns: new[] { "tenant_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_payments_tenant_id_booking_id_status",
                table: "payments",
                columns: new[] { "tenant_id", "booking_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_payments_tenant_id_provider_reference",
                table: "payments",
                columns: new[] { "tenant_id", "provider_reference" },
                unique: true,
                filter: "provider_reference IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_services_tenant_id_is_active_name",
                table: "services",
                columns: new[] { "tenant_id", "is_active", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_staff_tenant_id_email",
                table: "staff",
                columns: new[] { "tenant_id", "email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_staff_tenant_id_is_active",
                table: "staff",
                columns: new[] { "tenant_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_staff_tenant_id_user_id",
                table: "staff",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateIndex(
                name: "ix_tenants_is_active",
                table: "tenants",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_tenants_slug",
                table: "tenants",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_time_off_tenant_id_staff_id_starts_at",
                table: "time_off",
                columns: new[] { "tenant_id", "staff_id", "starts_at" });

            migrationBuilder.CreateIndex(
                name: "ix_users_tenant_id_email",
                table: "users",
                columns: new[] { "tenant_id", "email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_tenant_id_is_active",
                table: "users",
                columns: new[] { "tenant_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_working_hours_tenant_id_staff_id_day_of_week",
                table: "working_hours",
                columns: new[] { "tenant_id", "staff_id", "day_of_week" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_working_hours_breaks_tenant_id_working_hours_id",
                table: "working_hours_breaks",
                columns: new[] { "tenant_id", "working_hours_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "time_off");

            migrationBuilder.DropTable(
                name: "working_hours_breaks");

            migrationBuilder.DropTable(
                name: "bookings");

            migrationBuilder.DropTable(
                name: "working_hours");

            migrationBuilder.DropTable(
                name: "customers");

            migrationBuilder.DropTable(
                name: "services");

            migrationBuilder.DropTable(
                name: "staff");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "tenants");
        }
    }
}
