namespace Slotly.Infrastructure.Persistence;

public sealed class ProcessedWebhookEvent
{
    private ProcessedWebhookEvent()
    {
    }

    public string EventId { get; private set; } = string.Empty;

    public string EventType { get; private set; } = string.Empty;

    public DateTimeOffset ProcessedAt { get; private set; }

    public static ProcessedWebhookEvent Create(string eventId, string eventType, DateTimeOffset processedAt)
        => new()
        {
            EventId = eventId,
            EventType = eventType,
            ProcessedAt = processedAt,
        };
}
