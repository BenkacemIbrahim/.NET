using System.Globalization;
using FluentAssertions;
using Slotly.Application.Bookings;
using Slotly.Domain.ValueObjects;

namespace Slotly.Application.Tests.Bookings;

public sealed class AvailabilityEngineTests
{
    private readonly AvailabilityEngine _engine = new();

    [Fact]
    public void FindsSlotsAroundBreaksTimeOffBookingsAndBuffers()
    {
        var staffId = Guid.NewGuid();
        var date = new DateOnly(2026, 10, 26);
        var workingDay = new WorkingDayAvailability(
            DayOfWeek.Monday,
            new DailyTimeRange(new TimeOnly(9, 0), new TimeOnly(13, 0)),
            [new DailyTimeRange(new TimeOnly(11, 0), new TimeOnly(11, 30))]);
        var staff = new StaffAvailability(
            staffId,
            [workingDay],
            [new BusyPeriod(Utc(2026, 10, 26, 12, 0), Utc(2026, 10, 26, 12, 30))],
            [new BusyPeriod(Utc(2026, 10, 26, 9, 45), Utc(2026, 10, 26, 10, 15))]);
        var search = new AvailabilitySearch(
            date,
            date,
            TimeSpan.FromMinutes(30),
            TimeSpan.FromMinutes(15),
            TimeSpan.FromMinutes(15),
            TimeZoneInfo.Utc,
            [staff]);

        var slots = _engine.FindAvailableSlots(search);

        slots.Select(slot => slot.StartsAt.TimeOfDay).Should().Equal(
            new TimeSpan(9, 0, 0),
            new TimeSpan(10, 15, 0),
            new TimeSpan(12, 30, 0));
    }

    [Fact]
    public void SkipsNonexistentLocalTimesDuringSpringForward()
    {
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
        var date = new DateOnly(2026, 3, 8);
        var staff = Schedule(
            date.DayOfWeek,
            new TimeOnly(1, 30),
            new TimeOnly(4, 0));
        var search = new AvailabilitySearch(
            date,
            date,
            TimeSpan.FromMinutes(30),
            TimeSpan.Zero,
            TimeSpan.FromMinutes(30),
            timeZone,
            [staff]);

        var slots = _engine.FindAvailableSlots(search);

        slots.Select(slot => slot.LocalStartsAt.ToString("HH:mm zzz", CultureInfo.InvariantCulture)).Should().Equal(
            "01:30 -05:00",
            "03:00 -04:00",
            "03:30 -04:00");
    }

    [Fact]
    public void ReturnsBothOccurrencesOfAmbiguousLocalTimesDuringFallBack()
    {
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
        var date = new DateOnly(2026, 11, 1);
        var staff = Schedule(
            date.DayOfWeek,
            new TimeOnly(1, 0),
            new TimeOnly(2, 0));
        var search = new AvailabilitySearch(
            date,
            date,
            TimeSpan.FromMinutes(30),
            TimeSpan.Zero,
            TimeSpan.FromMinutes(30),
            timeZone,
            [staff]);

        var slots = _engine.FindAvailableSlots(search);

        slots.Should().HaveCount(4);
        slots.Select(slot => slot.StartsAt).Should().OnlyHaveUniqueItems();
        slots.Select(slot => slot.LocalStartsAt.Offset).Should()
            .Contain(TimeSpan.FromHours(-4))
            .And.Contain(TimeSpan.FromHours(-5));
    }

    [Fact]
    public void CombinesAndSortsSlotsForAnyStaff()
    {
        var date = new DateOnly(2026, 10, 26);
        var first = Schedule(date.DayOfWeek, new TimeOnly(9, 0), new TimeOnly(10, 0));
        var second = Schedule(date.DayOfWeek, new TimeOnly(9, 30), new TimeOnly(10, 30));
        var search = new AvailabilitySearch(
            date,
            date,
            TimeSpan.FromMinutes(30),
            TimeSpan.Zero,
            TimeSpan.FromMinutes(30),
            TimeZoneInfo.Utc,
            [second, first]);

        var slots = _engine.FindAvailableSlots(search);

        slots.Should().HaveCount(4);
        slots.Select(slot => slot.StartsAt).Should().BeInAscendingOrder();
    }

    [Fact]
    public void RejectsSearchesLongerThanThirtyTwoCalendarDays()
    {
        var search = new AvailabilitySearch(
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 2, 3),
            TimeSpan.FromMinutes(30),
            TimeSpan.Zero,
            TimeSpan.FromMinutes(15),
            TimeZoneInfo.Utc,
            []);

        var act = () => _engine.FindAvailableSlots(search);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    private static StaffAvailability Schedule(
        DayOfWeek dayOfWeek,
        TimeOnly startsAt,
        TimeOnly endsAt)
        => new(
            Guid.NewGuid(),
            [new WorkingDayAvailability(dayOfWeek, new DailyTimeRange(startsAt, endsAt), [])],
            [],
            []);

    private static DateTimeOffset Utc(int year, int month, int day, int hour, int minute)
        => new(year, month, day, hour, minute, 0, TimeSpan.Zero);
}
