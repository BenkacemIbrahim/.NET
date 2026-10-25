# Booking engine

## Availability calculation

Availability is calculated in the Application layer so the scheduling rules are
independent of HTTP and persistence. The caller supplies the tenant time zone,
service duration and buffer, a local date range, and each candidate staff
member's weekly hours, breaks, time off, and active bookings.

For each staff member and local calendar day, the engine:

1. Finds the working-hours entry matching the local weekday.
2. Walks the working period in 15-minute increments.
3. Converts each local candidate to UTC using the tenant's IANA time zone.
4. Discards nonexistent wall-clock times during a daylight-saving gap and emits
   both UTC occurrences for ambiguous times during a daylight-saving overlap.
5. Rejects candidates whose service-plus-buffer interval exceeds working hours
   or intersects a break, time-off interval, or active booking.
6. Returns the remaining slots ordered by start time and staff member.

The appointment's displayed end is its service end. Collision checks extend to
`blocked_until`, which is the service end plus its configured buffer. All stored
instants use PostgreSQL `timestamptz`; local wall-clock values are used only when
applying the tenant's schedule.

## Booking writes and overlap protection

Create and reschedule operations run in a serializable PostgreSQL transaction.
They reload the current schedule and bookings, repeat the availability check,
then write the booking. Three independent controls protect the slot:

- Transactional re-check prevents a request from relying on stale availability.
- The booking UUID concurrency token changes on every update, rejecting stale
  state transitions and reschedules.
- PostgreSQL's `ex_bookings_staff_time_no_overlap` GiST exclusion constraint
  prevents intersecting `[starts_at, blocked_until)` ranges for the same tenant
  and staff member while bookings are Pending or Confirmed. The migration enables
  the `btree_gist` extension required to combine UUID equality and range overlap.

Exclusion violations, serialization failures, and deadlocks caused by competing
booking writes are returned as RFC 7807 `409 Conflict`. Clients should refresh
availability instead of blindly retrying the same slot.

## Booking lifecycle and cancellation

Bookings support create, get, filtered paginated list, cancel, reschedule,
complete, and no-show operations. Customer-facing operations require the
Customer role; completion and no-show transitions require Staff or TenantOwner.
All data access remains scoped to the authenticated tenant.

Each tenant has a time zone and cancellation-window duration. Cancellation is
accepted only when the current instant is no later than the booking start minus
that duration. The request must include the latest booking version.

## Verification

Domain tests cover policy and lifecycle invariants. Application tests cover
normal scheduling, breaks, buffers, time off, existing bookings, any-staff
search, invalid DST times, and both sides of an ambiguous DST time. API
integration tests run on a real Testcontainers PostgreSQL database and exercise
every management and booking endpoint. The concurrency test sends twelve
parallel requests for each of three slots and requires exactly one success per
slot, with every losing request returning `409 Conflict`.
