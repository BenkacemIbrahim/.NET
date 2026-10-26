# ADR 0001: Clean Architecture Pattern

## Context
Slotly is a multi-tenant SaaS booking platform requiring high business logic reliability (scheduling, buffer times, cancellation windows, payment states) while maintaining strict tenant isolation. The platform needs to support multiple interfaces (REST API, Hangfire background worker, SignalR hubs, React SPA) without coupling core scheduling invariants to any single delivery mechanism or persistence framework.

## Decision
We adopted Clean Architecture with strict inward dependency flow:
```text
Api -> Infrastructure -> Application -> Domain
 |                              |
 +------------------------------+
```
- **Domain**: Pure C# domain model (`Entity`, `ITenantOwned`, value objects like `TimeSlot` and `Money`, domain events). Zero external framework dependencies.
- **Application**: Use cases, validation (FluentValidation), ports/interfaces (`ITenantContext`, `IPaymentGateway`, `INotificationService`).
- **Infrastructure**: Adapters, EF Core DbContext, Npgsql PostgreSQL mappings, Hangfire job storage, SMTP Mailpit adapter, Stripe.net SDK.
- **Api**: ASP.NET Core Minimal APIs / Endpoint groups, JWT middleware, rate limiting, and SignalR hub composition.

## Consequences
- **Positive**: Domain logic is unit-testable without database mocks or HTTP context. Database migrations and external payment providers can evolve without altering scheduling rules.
- **Trade-offs**: Requires explicit mapping between API contracts and domain entities.
