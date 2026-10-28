# Changelog

All notable changes to Slotly will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Rebuilt the React marketing site, application shell, calendar, management screens, and public booking flow around a new flat Slotly scheduling design system.
- Replaced Plus Jakarta Sans with self-hosted Inter Variable and refreshed the navy, blue, and cool-gray visual tokens.
- Expanded Playwright viewport coverage to every application route at 390px and 1440px while preserving the existing authentication screen composition.
- Added the Calendly visual reference analysis and updated design-system documentation and screenshots.

## [1.0.0] - 2026-10-26

### Added

- Production release of the Slotly multi-tenant booking and scheduling platform.
- Architecture Decision Records (ADR 0001–0006) capturing architectural, multi-tenancy, concurrency, and frontend patterns.
- k6 automated load test suite verifying sub-25ms cached responses and 100% race-condition protection.
- Comprehensive REST API reference (`docs/api.md`) with request/response schemas and RFC 7807 problem details.
- Deployment runbook (`docs/deployment.md`) documenting production containers, free-tier cloud deployment, and zero-cost demo topologies.
- CodeQL automated security scanning and GitHub Container Registry (GHCR) publishing workflows.
- Release automation workflow packaging versioned GitHub Releases on semantic tags.

- Clean Architecture .NET 10 solution and test projects.
- ASP.NET Core API with health checks, Swagger, Serilog, and RFC 7807 errors.
- Docker Compose development infrastructure for PostgreSQL and Mailpit.
- Automated build and test foundation.
- Rich tenant, user, service, staff schedule, customer, booking, and payment
  domain models with validated value objects and lifecycle rules.
- PostgreSQL domain schema with snake_case naming, tenant-aware composite
  relationships, booking concurrency control, indexes, and audit timestamps.
- Global tenant query filters and cross-tenant write protection.
- Safe Development migration and realistic two-tenant seed data.
- Testcontainers coverage for tenant read and write isolation.
- Tenant-aware authentication system with JWT bearer tokens and claims.
- Refresh token rotation with cryptographic SHA-256 storage and reuse detection.
- Account lockout policy after 5 consecutive failed login attempts.
- Password change and session revocation flow.
- Staff invitation endpoint protected by TenantOwner role and tenant isolation policies.
- Fixed-window rate limiting on authentication endpoints (30 req/min).
- Comprehensive integration test suite using Testcontainers PostgreSQL verifying
  the full authentication lifecycle, lockout, token reuse detection, and tenant boundaries.
- Tenant-scoped CRUD APIs for services, staff, weekly working hours, breaks, and time off.
- Daylight-saving-aware availability search for a specific staff member or any active staff.
- Booking creation, filtering, cancellation, rescheduling, completion, and no-show APIs.
- Tenant time-zone and cancellation-window policies.
- Defense-in-depth overlap protection with transactional availability checks,
  optimistic concurrency, and a PostgreSQL GiST exclusion constraint.
- Endpoint and parallel-booking integration coverage against real PostgreSQL.
- Hangfire processing with PostgreSQL storage, retry policies, recurring
  maintenance jobs, and a PlatformAdmin-only dashboard.
- Transactional booking outbox with correlation-aware structured logging.
- Configurable SMTP confirmation, cancellation, reschedule, and reminder emails
  in HTML and plain text with idempotent delivery tracking.
- Real PostgreSQL and Mailpit integration coverage proving retries do not send duplicates.
- Stripe Checkout integration behind an application payment-gateway boundary.
- Per-tenant online-payment and optional deposit policies based on service pricing.
- Signed, idempotent Stripe webhook processing for successful checkout, failed
  payment, and refunded charges.
- Cancellation-window-aware Stripe refund endpoint and payment-driven booking transitions.
- Tenant-isolated SignalR availability updates for booking lifecycle changes.
- HybridCache-backed availability and tenant settings with mutation-aware
  invalidation and optional Redis L2 storage.
- Tenant-partitioned API rate limits with RFC 7807 throttling responses.
- PostgreSQL, Hangfire, and SMTP readiness checks plus process liveness checks.
- OpenTelemetry console traces and metrics, tenant/user log enrichment, and an
  optional Seq Compose profile.
- Strict CORS, security headers, request-size limits, and persisted sensitive-action audits.
- Authenticated SignalR, cache invalidation, and rate-limit integration tests.
- Tenant-branded React booking flow with live availability, customer details,
  Stripe Checkout handoff, responsive light/dark themes, and accessible states.
- Authenticated admin dashboard, FullCalendar schedule, booking actions, and
  management screens for services, staff, working hours, time off, and settings.
- OpenAPI-generated TypeScript API contracts, nginx container, Vitest component
  tests, Playwright browser journeys, visual baselines, and real-stack CI coverage.
