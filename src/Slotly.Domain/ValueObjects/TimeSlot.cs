namespace Slotly.Domain.ValueObjects;

public sealed record TimeSlot
{
    public TimeSlot(DateTimeOffset startsAt, DateTimeOffset endsAt)
    {
        var normalizedStart = startsAt.ToUniversalTime();
        var normalizedEnd = endsAt.ToUniversalTime();

        if (normalizedEnd <= normalizedStart)
        {
            throw new ArgumentException("A time slot must end after it starts.", nameof(endsAt));
        }

        StartsAt = normalizedStart;
        EndsAt = normalizedEnd;
    }

    public DateTimeOffset StartsAt { get; }

    public DateTimeOffset EndsAt { get; }

    public TimeSpan Duration => EndsAt - StartsAt;

    public bool Overlaps(TimeSlot other)
    {
        ArgumentNullException.ThrowIfNull(other);
        return StartsAt < other.EndsAt && EndsAt > other.StartsAt;
    }
}
