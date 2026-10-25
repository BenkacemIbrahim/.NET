namespace Slotly.Application.Bookings;

public sealed class AvailabilityEngine : IAvailabilityEngine
{
    public IReadOnlyCollection<AvailableSlot> FindAvailableSlots(AvailabilitySearch search)
    {
        Validate(search);

        var results = new List<AvailableSlot>();
        foreach (var staff in search.Staff)
        {
            for (var date = search.StartsOn; date <= search.EndsOn; date = date.AddDays(1))
            {
                foreach (var workingDay in staff.WorkingDays.Where(day => day.DayOfWeek == date.DayOfWeek))
                {
                    AddWorkingDaySlots(results, search, staff, workingDay, date);
                }
            }
        }

        return results
            .OrderBy(slot => slot.StartsAt)
            .ThenBy(slot => slot.StaffId)
            .ToArray();
    }

    private static void AddWorkingDaySlots(
        List<AvailableSlot> results,
        AvailabilitySearch search,
        StaffAvailability staff,
        WorkingDayAvailability workingDay,
        DateOnly date)
    {
        var localOpening = date.ToDateTime(workingDay.Range.StartsAt, DateTimeKind.Unspecified);
        var localClosing = date.ToDateTime(workingDay.Range.EndsAt, DateTimeKind.Unspecified);

        for (var localStart = localOpening;
             localStart < localClosing;
             localStart = localStart.Add(search.SlotInterval))
        {
            foreach (var start in ResolveLocalTime(localStart, search.TimeZone))
            {
                var end = start.ToUniversalTime().Add(search.ServiceDuration);
                var blockedUntil = end.Add(search.BufferTime);
                var localEnd = TimeZoneInfo.ConvertTime(end, search.TimeZone);
                var localBlockedUntil = TimeZoneInfo.ConvertTime(blockedUntil, search.TimeZone);

                if (localEnd.Date != localOpening.Date
                    || localEnd.TimeOfDay > workingDay.Range.EndsAt.ToTimeSpan()
                    || OverlapsBreak(localStart, localBlockedUntil.DateTime, workingDay))
                {
                    continue;
                }

                var startsAt = start.ToUniversalTime();
                if (staff.TimeOff.Any(period => period.Overlaps(startsAt, blockedUntil))
                    || staff.Bookings.Any(period => period.Overlaps(startsAt, blockedUntil)))
                {
                    continue;
                }

                results.Add(new AvailableSlot(
                    staff.StaffId,
                    startsAt,
                    end,
                    start,
                    localEnd));
            }
        }
    }

    private static bool OverlapsBreak(
        DateTime localStart,
        DateTime localBlockedUntil,
        WorkingDayAvailability workingDay)
    {
        var candidateStart = TimeOnly.FromDateTime(localStart);
        var candidateEnd = TimeOnly.FromDateTime(localBlockedUntil);
        return workingDay.Breaks.Any(workingBreak =>
            candidateStart < workingBreak.EndsAt && candidateEnd > workingBreak.StartsAt);
    }

    private static DateTimeOffset[] ResolveLocalTime(
        DateTime localTime,
        TimeZoneInfo timeZone)
    {
        if (timeZone.IsInvalidTime(localTime))
        {
            return [];
        }

        if (timeZone.IsAmbiguousTime(localTime))
        {
            return timeZone.GetAmbiguousTimeOffsets(localTime)
                .Select(offset => new DateTimeOffset(localTime, offset))
                .OrderBy(value => value.UtcDateTime)
                .ToArray();
        }

        return [new DateTimeOffset(localTime, timeZone.GetUtcOffset(localTime))];
    }

    private static void Validate(AvailabilitySearch search)
    {
        ArgumentNullException.ThrowIfNull(search);
        ArgumentNullException.ThrowIfNull(search.TimeZone);
        ArgumentNullException.ThrowIfNull(search.Staff);

        if (search.EndsOn < search.StartsOn || search.EndsOn.DayNumber - search.StartsOn.DayNumber > 31)
        {
            throw new ArgumentOutOfRangeException(
                nameof(search),
                "Availability searches must span between one and 32 calendar days.");
        }

        if (search.ServiceDuration <= TimeSpan.Zero || search.ServiceDuration > TimeSpan.FromDays(1))
        {
            throw new ArgumentOutOfRangeException(nameof(search), "Service duration is invalid.");
        }

        if (search.BufferTime < TimeSpan.Zero || search.BufferTime > TimeSpan.FromDays(1))
        {
            throw new ArgumentOutOfRangeException(nameof(search), "Buffer time is invalid.");
        }

        if (search.SlotInterval <= TimeSpan.Zero || search.SlotInterval > TimeSpan.FromHours(1))
        {
            throw new ArgumentOutOfRangeException(nameof(search), "Slot interval is invalid.");
        }
    }
}
