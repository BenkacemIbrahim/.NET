using Slotly.Domain.ValueObjects;

namespace Slotly.Application.Bookings;

public sealed record WorkingDayAvailability(
    DayOfWeek DayOfWeek,
    DailyTimeRange Range,
    IReadOnlyCollection<DailyTimeRange> Breaks);

public sealed record BusyPeriod(
    DateTimeOffset StartsAt,
    DateTimeOffset BlockedUntil)
{
    public bool Overlaps(DateTimeOffset startsAt, DateTimeOffset blockedUntil)
        => StartsAt < blockedUntil && BlockedUntil > startsAt;
}

public sealed record StaffAvailability(
    Guid StaffId,
    IReadOnlyCollection<WorkingDayAvailability> WorkingDays,
    IReadOnlyCollection<BusyPeriod> TimeOff,
    IReadOnlyCollection<BusyPeriod> Bookings);

public sealed record AvailabilitySearch(
    DateOnly StartsOn,
    DateOnly EndsOn,
    TimeSpan ServiceDuration,
    TimeSpan BufferTime,
    TimeSpan SlotInterval,
    TimeZoneInfo TimeZone,
    IReadOnlyCollection<StaffAvailability> Staff);

public sealed record AvailableSlot(
    Guid StaffId,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    DateTimeOffset LocalStartsAt,
    DateTimeOffset LocalEndsAt);
