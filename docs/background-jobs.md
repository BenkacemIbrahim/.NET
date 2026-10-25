# Background jobs and notifications

## Runtime

Slotly runs Hangfire inside the API process and stores all job state in the same
PostgreSQL server under the `hangfire` schema. The server registers four
recurring jobs:

- `outbox-processor` runs every minute and dispatches booking domain events.
- `booking-reminders` sends deduplicated reminders 24 hours and 1 hour before a booking.
- `expire-pending-bookings` cancels unpaid Pending bookings after the configured timeout.
- `cleanup-old-job-data` runs daily and deletes expired refresh tokens and old processed outbox rows.

Jobs use bounded automatic retries with increasing delays and a distributed
concurrency lock. The dashboard is available at `/hangfire`; its authorization
filter admits authenticated `PlatformAdmin` users only.

## Transactional outbox

Booking creation, cancellation, and rescheduling raise domain events. During
`SaveChanges`, those events are serialized into `outbox_messages` in the same
database transaction as the booking change. A failed booking transaction
therefore cannot leave a notification behind, and a committed change cannot be
lost between the API and the job queue.

Each outbox row retains its processing status, attempt count, last error, and
the HTTP correlation ID. The processor restores that correlation ID as a
structured logging scope so the originating request and asynchronous work can
be traced together.

## Email and idempotency

Email is sent through SMTP using MailKit. Local Compose points the API at the
real Mailpit SMTP listener; production can supply any compatible provider using
the `Smtp__*` configuration values. Confirmation, cancellation, reschedule, and
reminder messages include both HTML and plain-text bodies.

Before SMTP delivery, the processor reserves a unique idempotency key in
`notification_deliveries`. Reprocessing a completed outbox message or reminder
finds the existing key and sends nothing. An SMTP failure removes the
reservation before Hangfire retries, preventing both permanent suppression and
ordinary retry duplicates.

## Local verification

Start the stack and open Mailpit and Hangfire:

```bash
docker compose -f docker/compose.yml --profile api up --build -d
```

- Mailpit: <http://localhost:8025>
- Hangfire: <http://localhost:8080/hangfire> (PlatformAdmin JWT required)
- Mailpit API: `GET http://localhost:8025/api/v1/messages`

Run the automated real-infrastructure test with:

```bash
dotnet test tests/Slotly.Api.IntegrationTests/Slotly.Api.IntegrationTests.csproj \
  --filter FullyQualifiedName~NotificationIntegrationTests
```

The test creates a booking through HTTP, processes its persisted outbox message,
reads the confirmation through Mailpit's API, processes the outbox again, and
asserts that exactly one message and one delivery record exist.
