# Slotly REST API Reference

The Slotly API is built with ASP.NET Core Minimal APIs on .NET 10. It follows REST conventions, emits RFC 7807 Problem Details for errors, and enforces tenant isolation on all tenant-owned resources.

---

## 1. General Conventions

### Base URLs
- **Local Docker Compose**: `http://localhost:8080` (API direct) or `http://localhost:3000/api` (via web proxy)
- **Interactive OpenAPI Documentation**: `http://localhost:8080/swagger`

### Tenant Resolution
Tenant-scoped endpoints resolve the active tenant through one of the following mechanisms (in order of priority):
1. **Authenticated JWT Claims**: `tenant_id` claim inside the Bearer token.
2. **HTTP Header (UUID)**: `X-Tenant-Id: <tenant-guid>`
3. **HTTP Header (Slug)**: `X-Tenant: <tenant-slug>` (e.g. `X-Tenant: northstar-health`)
4. **Subdomain Resolution**: `<tenant-slug>.slotly.local` (when enabled via `Tenancy__EnableSubdomainResolution`)

---

## 2. Authentication & Authorization

### Authentication Schemes
- **Bearer Token**: Transmitted in the `Authorization: Bearer <token>` header.
- **Access Tokens**: Short-lived JWT (default 15 minutes) containing `sub`, `email`, `role`, and `tenant_id`.
- **Refresh Tokens**: Cryptographically hashed (SHA-256) rotating refresh tokens with automatic token family revocation upon reuse detection.

### Authentication Endpoints

#### Register Tenant
`POST /api/v1/auth/register-tenant`
```json
{
  "tenantName": "Apex Dental Studio",
  "tenantSlug": "apex-dental",
  "ownerEmail": "dr.smith@apexdental.example",
  "ownerName": "Dr. Smith",
  "password": "SecurePassword123!"
}
```
**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "d5f8...",
  "expiresAt": "2026-10-26T12:00:00Z",
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "tenantId": "22222222-2222-2222-2222-222222222222",
    "email": "dr.smith@apexdental.example",
    "displayName": "Dr. Smith",
    "role": "TenantOwner",
    "isActive": true
  }
}
```

#### Login
`POST /api/v1/auth/login`
```json
{
  "tenantSlug": "northstar-health",
  "email": "amira@northstar.example",
  "password": "Password123!"
}
```

#### Refresh Token Rotation
`POST /api/v1/auth/refresh`
```json
{
  "refreshToken": "d5f8..."
}
```

---

## 3. Rate Limiting Policies

Slotly enforces partitioned rate limiting using ASP.NET Core rate limiters:

| Policy | Partition Key | Limit | Window | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| **`auth`** | Remote IP address | 30 requests | 1 minute | 429 Too Many Requests |
| **`tenant-api`** | Tenant ID or IP | 120 requests (configurable) | 1 minute | 429 Too Many Requests |
| **`tenant-write`**| Tenant ID or IP | 80 tokens (configurable) | Replenish 40/min | 429 Too Many Requests |

### Error Format (RFC 7807)
When throttled, the API returns a structured Problem Details response:
```json
{
  "type": "https://tools.ietf.org/html/rfc6585#section-4",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later."
}
```

---

## 4. Public Booking Endpoints

### 1. Get Tenant Public Settings
`GET /api/v1/public/tenant`
- **Header**: `X-Tenant: northstar-health`
- **Response**:
```json
{
  "id": "a2abcf2f-825f-49ee-bcb0-8d61fdd528bc",
  "name": "Northstar Health Clinic",
  "slug": "northstar-health",
  "timeZoneId": "Africa/Casablanca",
  "cancellationWindowHours": 24,
  "primaryColor": "#5145CD",
  "logoUrl": null,
  "onlinePaymentsEnabled": false,
  "depositPercentage": null
}
```

### 2. Search Available Slots
`GET /api/v1/availability?serviceId={serviceId}&startsOn=2026-11-02&endsOn=2026-11-06&staffId={staffId}`
- Computes availability across staff working hours, scheduled breaks, approved time-offs, buffer times, and existing bookings.
- Timezone-aware: handles daylight saving transitions with unambiguous local offsets.
- **Response (200 OK)**:
```json
[
  {
    "staffId": "4c7928a2-8365-4f5f-b446-c7a4c8cf0f84",
    "startsAt": "2026-11-02T09:00:00Z",
    "endsAt": "2026-11-02T09:30:00Z",
    "localStartsAt": "2026-11-02T09:00:00+00:00",
    "localEndsAt": "2026-11-02T09:30:00+00:00"
  }
]
```

### 3. Create Appointment
`POST /api/v1/bookings`
- Protected by PostgreSQL GiST exclusion constraint against overlapping bookings.
- **Request Body**:
```json
{
  "serviceId": "bfb52d09-e455-4615-9651-3879faec0e4a",
  "staffId": "4c7928a2-8365-4f5f-b446-c7a4c8cf0f84",
  "startsAt": "2026-11-02T09:00:00Z",
  "customerId": null,
  "customerName": "Sara Martin",
  "customerEmail": "sara@example.com",
  "customerPhone": "+212600000000",
  "notes": "First checkup"
}
```
- **Response (201 Created)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "660e8400-e29b-41d4-a716-446655440001",
  "serviceId": "bfb52d09-e455-4615-9651-3879faec0e4a",
  "staffId": "4c7928a2-8365-4f5f-b446-c7a4c8cf0f84",
  "startsAt": "2026-11-02T09:00:00Z",
  "endsAt": "2026-11-02T09:30:00Z",
  "blockedUntil": "2026-11-02T09:40:00Z",
  "status": 2,
  "cancellationReason": null,
  "version": "770e8400-e29b-41d4-a716-446655440002",
  "paymentId": null,
  "checkoutUrl": null
}
```

---

## 5. Tenant Administration Endpoints

Requires `Authorization: Bearer <token>` with `TenantOwner` or `Staff` role.

### Bookings Management
- `GET /api/v1/bookings?page=1&pageSize=20&status=Confirmed`: List bookings with status filter.
- `GET /api/v1/bookings/{id}`: Retrieve single booking details.
- `POST /api/v1/bookings/{id}/complete`: Mark appointment as completed.
- `POST /api/v1/bookings/{id}/no-show`: Mark appointment as customer no-show.
- `POST /api/v1/bookings/{id}/cancel`: Cancel appointment (requires `reason` and `version`).
- `POST /api/v1/bookings/{id}/reschedule`: Move appointment to a new slot.

### Catalog & Team Management
- `GET /api/v1/services`: Paginated list of tenant services.
- `POST /api/v1/services`: Create service (`name`, `durationMinutes`, `priceAmount`, `currency`, `bufferMinutes`).
- `PUT /api/v1/services/{id}`: Update service details.
- `DELETE /api/v1/services/{id}`: Deactivate service.
- `GET /api/v1/staff`: List staff members.
- `POST /api/v1/staff/invite`: Invite new staff member.
- `GET /api/v1/staff/{staffId}/working-hours`: Get recurring weekly working hours and breaks.
- `PUT /api/v1/staff/{staffId}/working-hours`: Set weekly schedule.
- `GET /api/v1/staff/{staffId}/time-off`: List staff vacations and sick leave intervals.
- `POST /api/v1/staff/{staffId}/time-off`: Schedule time-off interval.

### Settings
- `GET /api/v1/settings`: Fetch active tenant policy and branding settings.
- `PUT /api/v1/settings`: Update tenant name, time zone, cancellation window, primary brand color, and logo.

---

## 6. Real-time & Health Endpoints

### SignalR Availability Hub
- **Endpoint**: `/hubs/availability`
- **Group**: `tenant:{tenantId}`
- **Event**: `SlotAvailabilityChanged`
  - Broadcast upon booking confirmation, cancellation, or reschedule, prompting connected clients to refresh slot availability.

### Health & Observability
- `GET /health`: Basic health check.
- `GET /health/live`: Process liveness check.
- `GET /health/ready`: Deep readiness check validating PostgreSQL, Hangfire schema, and SMTP server connectivity.
- `GET /hangfire`: Background job dashboard (PlatformAdmin role).
