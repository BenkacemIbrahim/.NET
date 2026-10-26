# ADR 0004: Transactional Outbox Pattern and Hangfire Background Processing

## Context
When bookings are created, rescheduled, or cancelled, notifications (emails, reminders) and external tasks must be executed reliably. If the database commit succeeds but the SMTP call fails (or vice versa), the system enters an inconsistent state (dual-write problem).

## Decision
We implemented the **Transactional Outbox Pattern** combined with **Hangfire**:
1. When booking state changes, an `OutboxMessage` containing the serialized domain event is saved within the *same* database transaction as the booking entity.
2. A Hangfire background job periodically drains pending outbox messages, publishing events to handlers.
3. Notification handlers record an `IdempotencyRecord` in PostgreSQL prior to sending emails via Mailpit/SMTP, guaranteeing at-least-once delivery with exactly-once side effects.
4. Background job state is persisted directly in PostgreSQL via `Hangfire.PostgreSql`.

## Consequences
- **Positive**: Eliminates dual-write anomalies; resilient to transient network or SMTP failures with automatic retries; transparent observability through Hangfire dashboard.
- **Trade-offs**: Small eventual-consistency delay (typically < 1-2 seconds) between booking submission and email dispatch.
