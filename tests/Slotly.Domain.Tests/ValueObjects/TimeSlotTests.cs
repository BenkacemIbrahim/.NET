using FluentAssertions;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Tests.ValueObjects;

public sealed class TimeSlotTests
{
    [Fact]
    public void ConstructorRejectsEndBeforeStart()
    {
        var start = new DateTimeOffset(2026, 10, 22, 10, 0, 0, TimeSpan.Zero);

        var act = () => new TimeSlot(start, start.AddMinutes(-30));

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void OverlapsReturnsFalseForAdjacentSlots()
    {
        var first = new TimeSlot(
            new DateTimeOffset(2026, 10, 22, 10, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 10, 22, 11, 0, 0, TimeSpan.Zero));
        var second = new TimeSlot(first.EndsAt, first.EndsAt.AddHours(1));

        first.Overlaps(second).Should().BeFalse();
    }
}
