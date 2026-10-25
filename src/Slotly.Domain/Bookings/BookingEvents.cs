using Slotly.Domain.Common;

namespace Slotly.Domain.Bookings;

public sealed record BookingCreated(
    Guid TenantId,
    Guid BookingId,
    DateTimeOffset StartsAt) : IDomainEvent;

public sealed record BookingCancelled(
    Guid TenantId,
    Guid BookingId,
    DateTimeOffset StartsAt,
    string Reason) : IDomainEvent;

public sealed record BookingRescheduled(
    Guid TenantId,
    Guid BookingId,
    DateTimeOffset PreviousStartsAt,
    DateTimeOffset StartsAt) : IDomainEvent;
