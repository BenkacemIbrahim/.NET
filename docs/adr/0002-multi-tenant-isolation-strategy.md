# ADR 0002: Multi-Tenant Data Isolation Strategy

## Context
Slotly serves multiple independent businesses (clinics, salons, gyms) on shared compute and database infrastructure. Preventing cross-tenant data leaks or unauthorized cross-tenant writes is a top-priority security invariant.

## Decision
We implemented a defense-in-depth, shared-database, shared-schema multi-tenancy model partitioned by `TenantId`:
1. **Resolution Boundary**: The API resolves tenant identity early via signed JWT claims (`tenant_id`), `X-Tenant-Id` header, `X-Tenant` slug header, or subdomain resolution (`slug.slotly.local`).
2. **EF Core Global Query Filters**: Every tenant-owned entity (`ITenantOwned`) is automatically filtered by `TenantContext.TenantId` on all reads (`Where(e => e.TenantId == CurrentTenantId)`).
3. **Write-Time Interception**: `SlotlyDbContext.SaveChangesAsync` automatically stamps `TenantId` on newly added entities and validates that modified or deleted entities belong to the active tenant, throwing an exception on tenant mismatch.
4. **Relational Constraints**: Composite foreign keys in PostgreSQL include `tenant_id`, guaranteeing database-level relational integrity even if application layers are bypassed.

## Consequences
- **Positive**: Low operational cost (single shared PostgreSQL instance), robust isolation verified by Testcontainers integration tests, zero boilerplate in individual queries.
- **Trade-offs**: Requires explicit `IgnoreQueryFilters()` only for cross-tenant administration (such as login resolution and platform outbox delivery).
