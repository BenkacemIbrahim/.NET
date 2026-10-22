using FluentAssertions;
using Slotly.Domain.Staff;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Tests.Staff;

public sealed class WorkingHoursTests
{
    [Fact]
    public void AddBreakRejectsTimeOutsideWorkingRange()
    {
        var hours = CreateWorkingHours();

        var act = () => hours.AddBreak(
            new DailyTimeRange(new TimeOnly(8, 30), new TimeOnly(9, 30)));

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void AddBreakRejectsOverlap()
    {
        var hours = CreateWorkingHours();
        hours.AddBreak(new DailyTimeRange(new TimeOnly(12, 0), new TimeOnly(13, 0)));

        var act = () => hours.AddBreak(
            new DailyTimeRange(new TimeOnly(12, 30), new TimeOnly(13, 30)));

        act.Should().Throw<InvalidOperationException>();
    }

    private static WorkingHours CreateWorkingHours()
        => WorkingHours.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            DayOfWeek.Monday,
            new DailyTimeRange(new TimeOnly(9, 0), new TimeOnly(17, 0)));
}
