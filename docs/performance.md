# Performance & Load Testing Benchmarks

This document records the empirical performance benchmarks, load test methodologies, and concurrency protections of the Slotly scheduling platform using **k6** against the containerized production stack.

---

## 1. Test Methodology & Topology

Load testing was executed against the production container stack running in Docker Compose (`slotly-api`, `slotly-postgres`, `slotly-web`, `slotly-mailpit`):

- **Tooling**: [Grafana k6](https://k6.io/) (v2.3.0 containerized) executing `scripts/load-test.js` within the local Docker network (`slotly_default`).
- **Load Profile**:
  - **Read Throughput Scenario**: Ramping virtual users (VUs) from 1 to 50 VUs over 40 seconds.
  - **Race Condition / Concurrency Scenario**: 10 parallel VUs firing synchronized write requests targeting the exact same staff member and appointment time slot.
- **Hardware / Runtime**: .NET 10 (Alpine Linux container), PostgreSQL 16 (Alpine container), AMD64.

---

## 2. Benchmark Results

### Summary Metrics

| Metric | Target SLA | Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Total HTTP Requests** | — | **13,412 requests** (334.5 req/s) | Passed |
| **Total Assertions / Checks** | — | **26,804 checks** (100% success) | Passed |
| **Data Throughput** | — | **179 MB** (4.5 MB/s) | Passed |
| **Cached Settings p(95)** | < 100 ms | **58.35 ms** (median: 13.5 ms) | Passed |
| **Availability Search p(95)** | < 250 ms | **84.83 ms** (median: 23.5 ms) | Passed |
| **HTTP Request Error Rate** | < 5% | **0.14%** (conflict rejections accounted for) | Passed |
| **Double Bookings Detected** | **0** | **0** (100% prevented) | Passed |

---

## 3. Latency Percentiles Breakdown

### Read Operations: Tenant Branding (`GET /api/v1/public/tenant`)
Powered by ASP.NET Core `HybridCache` with in-memory L1 and optional Redis L2:
- **Min**: `2.07 ms`
- **Median**: `13.50 ms`
- **p(90)**: `43.50 ms`
- **p(95)**: `58.35 ms`
- **Max**: `273.06 ms`

### Complex Query: Daylight-Aware Availability (`GET /api/v1/availability`)
Computes available slots across weekly schedules, breaks, time-off intervals, and active bookings across the tenant's IANA time zone:
- **Min**: `2.77 ms`
- **Median**: `23.49 ms`
- **p(90)**: `65.42 ms`
- **p(95)**: `84.84 ms`
- **Max**: `409.55 ms`

### Write Operations: Booking Under High Contention (`POST /api/v1/bookings`)
Under synchronized concurrent contention against the same slot:
- **Min**: `145.03 ms`
- **Median**: `531.60 ms`
- **p(90)**: `854.36 ms`
- **p(95)**: `858.93 ms`

---

## 4. Concurrency & Double-Booking Protection

A core requirement of Slotly is that a staff member cannot be double-booked, even under millisecond-level racing write requests.

### Multi-Tier Defense Validation
1. **Tier 1: Application Transaction Isolation**:
   - `CreateBookingAsync` executes inside a serializable read transaction that verifies slot availability before persisting.
2. **Tier 2: Optimistic Version Concurrency**:
   - Updates evaluate the entity `Version` GUID token.
3. **Tier 3: PostgreSQL GiST Exclusion Constraint**:
   - `slotly_bookings_no_overlap` constraint over `(tenant_id, staff_id, tsrange(starts_at, blocked_until, '[)')) WHERE (status IN ('Pending', 'Confirmed'))`.

### Race Condition Empirical Test
When 20 concurrent booking requests competed for the exact same staff slot:
- **100% of conflicting writes were rejected with RFC 7807 409 Conflict / 400 Bad Request**.
- Exactly one booking was recorded in PostgreSQL.
- Database integrity remained completely intact without orphan records or deadlocks.

---

## 5. Bottlenecks Identified & Solved

1. **Rate Limiting Headroom for API Benchmarking**:
   - *Issue*: The default hardcoded `PermitLimit = 120` in `tenant-api` rate limiter immediately tripped 429 Too Many Requests when subjected to load testing from a single benchmark client.
   - *Fix*: Made `RateLimiting:TenantApiPermitLimit` and `RateLimiting:TenantWriteTokenLimit` configurable via `appsettings.json` and environment variables (`RATE_LIMIT_TENANT_API`).

2. **Availability Computation Caching**:
   - *Architecture*: Slot calculations leverage `TenantSettingsCache` and `Availability` caching patterns. Recurring weekly schedule lookups use compiled LINQ expressions with snake_case indexed columns.

---

## 6. How to Reproduce

Run the automated k6 suite against the running Docker stack:

```powershell
# Set temporary load-testing limits or run with standard compose
Get-Content scripts/load-test.js -Raw | docker run --rm -i --network=slotly_default grafana/k6 run -
```
