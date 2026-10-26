# ADR 0003: Double-Booking Prevention via PostgreSQL GiST Exclusion Constraints

## Context
In appointment booking systems, race conditions can occur when multiple customers attempt to book the exact same staff member slot concurrently. Application-level checks (`if (!isBooked) book()`) suffer from race conditions unless strict database-level locks or constraints are enforced.

## Decision
We implemented a three-tier defense-in-depth model with a PostgreSQL GiST (Generalized Search Tree) exclusion constraint as the ultimate source of truth:
1. **Application Availability Engine**: Computes available slots respecting working hours, breaks, time-offs, buffer times, and daylight-saving time shifts.
2. **Optimistic Version Concurrency**: Modifying appointments requires matching the `Version` GUID token.
3. **PostgreSQL GiST Exclusion Constraint**:
   ```sql
   ALTER TABLE bookings ADD CONSTRAINT slotly_bookings_no_overlap
   EXCLUDE USING gist (
       tenant_id WITH =,
       staff_id WITH =,
       tsrange(starts_at, blocked_until, '[)') WITH &&
   )
   WHERE (status IN ('Pending', 'Confirmed'));
   ```

## Consequences
- **Positive**: Impossible to double-book a staff member, even under millisecond-level parallel concurrency. Verified by k6 load testing with 0 double bookings across racing transactions.
- **Trade-offs**: Requires the PostgreSQL `btree_gist` extension enabled during migrations.
