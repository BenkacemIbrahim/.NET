using Slotly.Domain.Common;

namespace Slotly.Infrastructure.Persistence;

public sealed class OutboxMessage
{
    private OutboxMessage()
    {
    }

    public Guid Id { get; private set; }

    public Guid TenantId { get; private set; }

    public string Type { get; private set; } = string.Empty;

    public string Payload { get; private set; } = string.Empty;

    public string CorrelationId { get; private set; } = string.Empty;

    public DateTimeOffset OccurredAt { get; private set; }

    public DateTimeOffset? ProcessedAt { get; private set; }

    public int AttemptCount { get; private set; }

    public string? LastError { get; private set; }

    public static OutboxMessage Create(
        IDomainEvent domainEvent,
        string payload,
        string correlationId,
        DateTimeOffset occurredAt)
        => new()
        {
            Id = Guid.NewGuid(),
            TenantId = domainEvent.TenantId,
            Type = domainEvent.GetType().Name,
            Payload = payload,
            CorrelationId = correlationId,
            OccurredAt = occurredAt,
        };

    public void MarkProcessed(DateTimeOffset processedAt)
    {
        ProcessedAt = processedAt;
        LastError = null;
    }

    public void RecordFailure(string error)
    {
        AttemptCount++;
        LastError = error.Length <= 2000 ? error : error[..2000];
    }
}
