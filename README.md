# Slotly

Slotly is a multi-tenant booking and scheduling platform for clinics, salons,
gyms, and other appointment-based businesses. This repository contains the
ASP.NET Core API and a responsive React application for customer booking and
tenant administration.

## Technology stack

- .NET 10, C#, and ASP.NET Core Web API
- React, TypeScript, Vite, Tailwind CSS, TanStack Query, and SignalR
- Clean Architecture: Domain, Application, Infrastructure, and Api
- Entity Framework Core with PostgreSQL
- Hangfire with PostgreSQL storage
- SignalR and Serilog
- xUnit, Testcontainers, and FluentAssertions
- Docker Compose and GitHub Actions

## Prerequisites

- [.NET SDK 10.0.402](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker
  Engine with Docker Compose v2
- Git
- Node.js 22 (only required when running the web application outside Docker)

## Quick start

Clone the repository, copy `.env.example` to `.env` if you want to override the
safe local defaults, and run:

```bash
docker compose -f docker/compose.yml up --build -d --wait
```

The local services are then available at:

- API health: <http://localhost:8080/health>
- Web application: <http://localhost:3000>
- Public demo booking page: <http://localhost:3000/book/northstar-health>
- API liveness: <http://localhost:8080/health/live>
- API readiness: <http://localhost:8080/health/ready>
- Swagger UI (Development): <http://localhost:8080/swagger>
- Mailpit: <http://localhost:8025>
- PostgreSQL: `localhost:5433`

To build and test without running the API container:

```bash
dotnet restore Slotly.sln
dotnet build Slotly.sln --configuration Release --no-restore
dotnet test Slotly.sln --configuration Release --no-build
cd src/slotly-web
npm ci
npm run lint && npm run typecheck && npm test && npm run build
npm run test:e2e
```

PowerShell shortcuts are available through `scripts/slotly.ps1`; run it with
`up`, `down`, `test`, or `migrate`.

## Architecture

Dependencies point inward: Domain has no project dependencies, Application
depends only on Domain, Infrastructure depends on Application, and Api composes
Application and Infrastructure. See [docs/architecture.md](docs/architecture.md)
for the tenant-boundary design and entity relationship model, and
[docs/auth.md](docs/auth.md) for the authentication and authorization design.
The availability algorithm and database-level overlap guarantees are described
in [docs/booking-engine.md](docs/booking-engine.md).
Reliable job processing, notification delivery, and operational settings are
documented in [docs/background-jobs.md](docs/background-jobs.md).
Stripe Checkout, webhook processing, refunds, and the manual test-mode workflow
are documented in [docs/payments.md](docs/payments.md).
Realtime availability, HybridCache, health checks, telemetry, and rate limiting
are documented in [docs/observability.md](docs/observability.md). The security
boundary, authorization review, and audit trail are documented in
[docs/security.md](docs/security.md).
The visual language and accessible component rules are defined in
[docs/design-system.md](docs/design-system.md).

## Features

The current foundation includes a production-shaped API host, rich scheduling
domain model, migrated PostgreSQL persistence, automatic Development seed data,
tenant-isolated EF Core reads and writes, tenant-aware authentication and authorization
(JWT + refresh token rotation with reuse detection), RFC 7807 error handling, structured
logging, Swagger with Bearer authorization, and local PostgreSQL and Mailpit infrastructure.
Tenant owners can manage services, staff, weekly working hours, breaks, and time
off through validated, paginated APIs. Customers can search daylight-saving-safe
availability and manage bookings; staff can complete bookings or mark no-shows.
Serializable writes, optimistic concurrency, and a PostgreSQL GiST exclusion
constraint guarantee that a staff member cannot be double-booked.
Booking lifecycle notifications and reminders are delivered through a
transactional outbox, Hangfire PostgreSQL jobs, and configurable SMTP with
idempotency protection. The PlatformAdmin-only Hangfire dashboard is exposed at
`/hangfire`.
Optional per-tenant online payments support full-price or deposit collection
through Stripe Checkout. Signed, idempotent webhooks drive booking confirmation,
failure release, and refund state.
Authenticated SignalR groups broadcast tenant-isolated slot changes. HybridCache
accelerates availability and tenant settings with optional Redis L2 storage.
The API also provides dependency-aware readiness checks, OpenTelemetry console
traces and metrics, tenant/user-enriched logs, tenant-partitioned rate limits,
strict CORS and security headers, request-size limits, and persisted audit logs.

The browser application provides a tenant-branded, mobile-first customer flow
with live slot updates and Stripe Checkout handoff. Its authenticated admin area
includes today's dashboard, weekly/monthly calendar, booking lifecycle actions,
services, team, working hours, time off, branding, and policy settings. It uses
the API-generated OpenAPI types throughout and supports light and dark themes.

![Slotly customer booking page](docs/screenshots/booking-desktop-light.png)

Development startup seeds Northstar Health Clinic and Atlas Wellness Studio,
each with services, staff, weekday hours, and lunch breaks. Tenant-scoped API
requests use an `X-Tenant-Id` header containing a tenant UUID, subdomain resolution,
or JWT tenant claims.

## Deployment

The API and nginx-served web app use multi-stage, non-root Docker images and run
in the default Compose stack. Environment-specific deployment guidance will be added when
the first hosted environment is introduced.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and quality
checks. This project is licensed under the [MIT License](LICENSE).
