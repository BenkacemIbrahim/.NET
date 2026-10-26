# Realtime, caching, and observability

## Realtime availability

Authenticated clients connect to `/hubs/availability` with a bearer token and
invoke `Subscribe(serviceId, date)`. The hub verifies that the service exists
inside the tenant resolved from the signed JWT claim before joining a group.
Group names contain the tenant, service, and local date, so events cannot cross
tenant boundaries. Creating, cancelling, or rescheduling a booking invalidates
the matching availability cache and publishes one `SlotChanged` message.

## HybridCache

Availability results use `HybridCache` with a 30-second local expiration and a
two-minute distributed expiration. Tenant settings use a five-minute cache.
Keys and tags include the tenant ID; service, staff schedule, time-off, booking,
and payment-policy mutations evict the affected tenant or service tag.

The default is process memory. To add Redis as the distributed L2 cache:

```powershell
$env:REDIS_CONNECTION_STRING = "redis:6379"
docker compose -f docker/compose.yml --profile api --profile redis up --build -d
```

On 2026-10-26, a clean local Docker run queried 50 slots for one seeded service,
staff member, and day. The uncached request took 468.65 ms; the median of ten
cached requests took 37.78 ms (12.4x faster, minimum 35.14 ms). This is a local
diagnostic measurement, not a production capacity claim.

## Health endpoints

- `/health/live` and the backwards-compatible `/health` test only the process.
- `/health/ready` verifies PostgreSQL connectivity, an active Hangfire server,
  and an SMTP TCP connection.

Orchestrators should restart on failed liveness and stop routing new traffic on
failed readiness.

## Traces, metrics, and logs

Outside the test environment, OpenTelemetry exports ASP.NET Core, `HttpClient`,
and runtime traces and metrics to the console. The resource service name is
`Slotly.Api`. Correlation IDs are accepted or generated as `X-Correlation-ID`
and flow into outbox work. Serilog enriches request logs with `TenantId` and
`UserId` after authentication and tenant resolution.

Seq is optional:

```powershell
$env:SEQ_URL = "http://seq:5341"
docker compose -f docker/compose.yml --profile api --profile seq up --build -d
```

The Seq UI is then available at `http://localhost:8081`. Console telemetry is
the zero-dependency default; an OTLP collector can be added when a deployment
has a chosen telemetry backend.

## Rate limits

Authentication is limited per source IP to 30 requests per minute. Tenant read
groups use a fixed 120 requests per minute, and tenant write groups use an
80-token bucket replenished by 40 tokens each minute. Rejections return RFC 7807
`application/problem+json` with status 429 and a trace ID.
