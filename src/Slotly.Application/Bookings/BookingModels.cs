using Slotly.Domain.Bookings;

namespace Slotly.Application.Bookings;

public sealed record CreateBookingRequest(
    Guid ServiceId,
    Guid StaffId,
    DateTimeOffset StartsAt,
    Guid? CustomerId,
    string? CustomerName,
    string? CustomerEmail,
    string? CustomerPhone);

public sealed record CancelBookingRequest(Guid Version, string Reason);

public sealed record RescheduleBookingRequest(Guid Version, DateTimeOffset StartsAt, Guid? StaffId = null);

public sealed record BookingStateRequest(Guid Version);

public sealed record BookingDto(
    Guid Id,
    Guid CustomerId,
    Guid ServiceId,
    Guid StaffId,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    DateTimeOffset BlockedUntil,
    BookingStatus Status,
    string? CancellationReason,
    Guid Version,
    Guid? PaymentId = null,
    string? CheckoutUrl = null);

public sealed record AvailabilityDto(
    Guid StaffId,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    DateTimeOffset LocalStartsAt,
    DateTimeOffset LocalEndsAt);
