# Slotly Deployment Guide

This guide describes how to deploy Slotly to containerized infrastructure, including free-tier cloud platforms for live portfolio demonstrations.

---

## 1. Hosting Architecture Options

Slotly supports two deployment topologies:

### Topology A: Full Micro-Compose (Recommended for Dedicated Compute)
- **`slotly-api`**: ASP.NET Core Web API container (`docker/Dockerfile`).
- **`slotly-web`**: Nginx container serving the React SPA (`docker/Dockerfile.web`).
- **`postgres`**: Managed PostgreSQL 16+ instance.
- **`mailpit`** or production SMTP (SendGrid, Postmark, AWS SES).
- **`redis`** (Optional): HybridCache L2 storage.

### Topology B: Slimmed Single-Container Demo (Recommended for Free Cloud Hosts)
- **Host**: Free container PaaS (Render, Fly.io, Koyeb, Railway).
- **Architecture**: A single container image (`docker/Dockerfile.demo`) where the ASP.NET Core API serves both the compiled React SPA static files (`dist/`) and the API endpoints under `/api/`, `/health/`, and `/hubs/`.
- **Database**: Free serverless PostgreSQL (Neon.tech or Supabase).
- **Cache**: In-memory `HybridCache` L1 (zero extra container requirement).
- **Background Jobs**: Hangfire running embedded within the API process backed by the PostgreSQL database.

---

## 2. Free-Tier Cloud Hosting Evaluation

To enable running a live demo at zero cost, we evaluated current free-tier options:

| Provider | Service Type | Free Tier Limits | Cold Start Behavior | Suitability |
| :--- | :--- | :--- | :--- | :--- |
| **Render** | Web Service (Docker) | 512 MB RAM, 0.1 CPU, 750 free hours/month | Spins down after 15 min idle; wakes on HTTP (~45-50s cold start) | **Excellent (Recommended)** |
| **Neon.tech** | Managed Serverless PostgreSQL | 0.5 GB storage, auto-scaling compute | Auto-suspends after 5 min; wakes in ~500ms on connection | **Excellent (Recommended)** |
| **Supabase** | Managed PostgreSQL | 500 MB storage, 2 active projects | Pauses after 7 days inactivity; manual unpause | Good |
| **Fly.io** | Container PaaS | 256 MB micro VM (limited free credits) | Fast cold start (< 2s) | Good |
| **Koyeb** | Container PaaS | 512 MB RAM instance, 2 services | Continuous execution | Good |

---

## 3. Slimmed Demo Container (`docker/Dockerfile.demo`)

The slimmed demo Dockerfile combines the frontend build with the .NET 10 API, eliminating the need for an Nginx reverse proxy container:

1. **Stage 1 (Frontend Build)**: Node 22 Alpine runs `npm ci` and `npm run build` to generate `dist/`.
2. **Stage 2 (.NET Build)**: .NET 10 SDK compiles and publishes `Slotly.Api` in Release mode.
3. **Stage 3 (Final Image)**: Copies both published .NET binaries and the frontend `wwwroot` folder into a hardened ASP.NET Core Alpine image.

---

## 4. Production Environment Configuration

Set the following environment variables on your cloud provider:

```bash
# ASP.NET Core Runtime
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080

# Database Connection (Neon, Supabase, or Managed PostgreSQL)
ConnectionStrings__SlotlyDatabase="Host=ep-xyz.neon.tech;Port=5432;Database=neondb;Username=user;Password=secret;SslMode=Require"

# JWT Authentication (generate a secure 64-character random string)
Jwt__SigningKey="your-production-high-entropy-jwt-signing-key-here-minimum-32-chars"
Jwt__Issuer="slotly-api"
Jwt__Audience="slotly-clients"
Jwt__AccessTokenLifetimeMinutes=15
Jwt__RefreshTokenLifetimeDays=7

# Tenancy Resolution
Tenancy__BaseDomain="onrender.com"
Tenancy__EnableSubdomainResolution=false
Tenancy__EnableHeaderResolution=true

# Background Jobs & SMTP
BackgroundJobs__PendingBookingExpiryMinutes=15
BackgroundJobs__RetentionDays=30
Smtp__Host="smtp.sendgrid.net" # Or omit to use development outbox logging
Smtp__Port=587
Smtp__UseSsl=true
Smtp__Username="apikey"
Smtp__Password="your-smtp-api-key"
Smtp__FromAddress="notifications@slotly.app"
Smtp__FromName="Slotly"

# Optional Stripe Integration (leave empty for free in-person demo mode)
Stripe__SecretKey=""
Stripe__WebhookSecret=""
Stripe__SuccessUrl="https://slotly-demo.onrender.com/payments/success"
Stripe__CancelUrl="https://slotly-demo.onrender.com/payments/cancel"

# Rate Limiting
RateLimiting__TenantApiPermitLimit=120
RateLimiting__TenantWriteTokenLimit=80
```

---

## 5. Automated Database Migration & Seeding

On startup in Production:
- If `SlotlyDbContext` detects pending migrations, EF Core applies them safely via `Database.MigrateAsync()`.
- Initial demo data (Northstar Health Clinic and Atlas Wellness Studio) is automatically seeded if no tenants exist, ensuring the live site is instantly functional.

---

## 6. Cold Start Considerations & Mitigation

On free hosting tiers (e.g. Render Web Services):
- **Spin Down**: When no traffic is received for 15 minutes, Render spins down the container to 0 instances.
- **Cold Wakeup**: The first incoming request takes **45–50 seconds** to provision the container, boot .NET 10, connect to PostgreSQL, and complete health checks.
- **Mitigation**:
  1. A UptimeRobot or GitHub Actions cron heartbeat pinging `GET /health/live` every 10 minutes prevents idle sleep during demonstration periods.
  2. The frontend displays graceful skeleton loaders and timeout retries.
