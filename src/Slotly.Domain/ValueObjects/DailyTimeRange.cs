namespace Slotly.Domain.ValueObjects;

public sealed record DailyTimeRange
{
    public DailyTimeRange(TimeOnly startsAt, TimeOnly endsAt)
    {
        if (endsAt <= startsAt)
        {
            throw new ArgumentException(
                "A daily time range must end after it starts.",
                nameof(endsAt));
        }

        StartsAt = startsAt;
        EndsAt = endsAt;
    }

    public TimeOnly StartsAt { get; }

    public TimeOnly EndsAt { get; }

    public bool Contains(DailyTimeRange other)
    {
        ArgumentNullException.ThrowIfNull(other);
        return StartsAt <= other.StartsAt && EndsAt >= other.EndsAt;
    }

    public bool Overlaps(DailyTimeRange other)
    {
        ArgumentNullException.ThrowIfNull(other);
        return StartsAt < other.EndsAt && EndsAt > other.StartsAt;
    }
}
