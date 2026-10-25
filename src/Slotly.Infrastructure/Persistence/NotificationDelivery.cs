namespace Slotly.Infrastructure.Persistence;

public sealed class NotificationDelivery
{
    private NotificationDelivery()
    {
    }

    public Guid Id { get; private set; }

    public Guid TenantId { get; private set; }

    public Guid BookingId { get; private set; }

    public string IdempotencyKey { get; private set; } = string.Empty;

    public string Recipient { get; private set; } = string.Empty;

    public string Subject { get; private set; } = string.Empty;

    public DateTimeOffset ReservedAt { get; private set; }

    public DateTimeOffset? SentAt { get; private set; }

    public static NotificationDelivery Reserve(
        Guid tenantId,
        Guid bookingId,
        string idempotencyKey,
        string recipient,
        string subject,
        DateTimeOffset now)
        => new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            BookingId = bookingId,
            IdempotencyKey = idempotencyKey,
            Recipient = recipient,
            Subject = subject,
            ReservedAt = now,
        };

    public void MarkSent(DateTimeOffset now) => SentAt = now;
}
