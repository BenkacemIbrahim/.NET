# API security

## Request boundary

- JWT issuer, audience, signature, lifetime, role, and tenant claims are
  validated before tenant resolution.
- CORS allows only the exact origins configured in `Cors:AllowedOrigins`; it
  never uses wildcard origins and supports credentials only for those origins.
- Kestrel rejects request bodies larger than 1 MiB.
- Responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, a restrictive permissions policy, and a
  default-deny content security policy.
- Global errors, validation failures, conflicts, and throttling use RFC 7807
  Problem Details without exposing exception internals.

Production deployments must replace the local JWT key, use TLS at the ingress,
restrict forwarded headers to trusted proxies, and set the CORS origin list to
the deployed frontend only.

## Authorization review

| Surface | Required access | Additional boundary |
| --- | --- | --- |
| Tenant registration, login, refresh | Anonymous | Validation, lockout, refresh rotation/reuse detection, IP rate limit |
| Current user, password change | Authenticated active tenant user | JWT tenant claim |
| Staff invitation | TenantOwner | Tenant-scoped write guard |
| Service, staff, hours, time-off reads | Active tenant user | EF global tenant filters |
| Service, staff, hours, time-off writes | TenantOwner | Cross-tenant write blocker and cache eviction |
| Availability | Active customer-capable tenant user | Tenant-aware query filters and throttling |
| Booking create/get/list/cancel/reschedule | Active customer-capable tenant user | Tenant filters, lifecycle checks, concurrency controls |
| Complete/no-show | Tenant staff | Booking tenant and status checks |
| Payment policy | TenantOwner | Tenant settings eviction |
| Checkout/payment/refund | Active customer-capable tenant user | Tenant booking lookup and cancellation/refund rules |
| Stripe webhook | Anonymous | Stripe signature verification and event-ID idempotency |
| SignalR availability hub | Active customer-capable tenant user | JWT-derived tenant and tenant-prefixed groups |
| Hangfire dashboard | PlatformAdmin | Dashboard authorization filter |
| Health and Swagger in Development | Anonymous | Health exposes only status; Swagger is Development-only |

Customer accounts are currently tenant-wide actors because the domain does not
yet link an authenticated user to a single `Customer` row. Before exposing a
public customer portal, that link and owner-or-staff override policy must be
implemented so a customer can read only their own bookings.

## Audit records

Successful and client-rejected POST, PUT, PATCH, and DELETE requests are stored
in `audit_logs` with tenant ID, user ID, action/endpoint, method, path, response
status, correlation ID, source IP, and UTC timestamp. Audit persistence failures
are logged and do not replace the original API response. The table is append-only
through application code and has indexes for tenant/time and user/time review.

Audit logs deliberately exclude request and response bodies so passwords,
tokens, payment details, and customer content are not duplicated. Database
access to audit records should be limited to operational administrators and
covered by the deployment retention policy.

## Operational checklist

1. Store JWT, SMTP, Stripe, database, and Seq credentials in a secret manager.
2. Configure exact HTTPS CORS origins and reject direct public access to
   PostgreSQL, Redis, SMTP, and Seq.
3. Require TLS and secure proxy headers at the ingress.
4. Alert on readiness failures, repeated 401/403/429 responses, payment webhook
   failures, audit persistence warnings, and Hangfire retry exhaustion.
5. Back up PostgreSQL and test restoration, including audit and outbox tables.
6. Review role assignments and PlatformAdmin access regularly.
