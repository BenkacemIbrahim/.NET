# ADR 0006: Real-time Slot Invalidation via SignalR and HybridCache

## Context
When an appointment is booked, other customers viewing the same date need to see updated availability without polling the server every few seconds. In addition, tenant branding and availability computations should be accelerated without stale cache data.

## Decision
We combined ASP.NET Core `HybridCache` with tenant-partitioned SignalR groups:
1. **HybridCache**: Caches tenant branding and availability responses in an in-memory L1 cache, with optional Redis L2 support when configured.
2. **SignalR Broadcasts**: When a booking is confirmed, cancelled, or rescheduled, the API publishes a `SlotAvailabilityChanged` message to the tenant SignalR hub group (`tenant:{tenantId}`).
3. **Cache Eviction**: Booking mutations immediately evict cached availability keys (`availability:{tenantId}:*`), ensuring consistency.
4. **Client Invalidation**: The React web client subscribes to the tenant SignalR hub and triggers TanStack Query query invalidation on incoming slot change notifications.

## Consequences
- **Positive**: Sub-25ms availability search responses under heavy load; instantaneous UI updates across browser tabs without aggressive polling.
- **Trade-offs**: Requires persistent WebSocket connection support in hosting environments.
