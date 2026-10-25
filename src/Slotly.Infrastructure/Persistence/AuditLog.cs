namespace Slotly.Infrastructure.Persistence;

public sealed class AuditLog
{
    private AuditLog()
    {
    }

    public Guid Id { get; private set; }
    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string Method { get; private set; } = string.Empty;
    public string Path { get; private set; } = string.Empty;
    public int StatusCode { get; private set; }
    public string CorrelationId { get; private set; } = string.Empty;
    public string? IpAddress { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }

    public static AuditLog Create(
        Guid? tenantId,
        Guid? userId,
        string action,
        string method,
        string path,
        int statusCode,
        string correlationId,
        string? ipAddress,
        DateTimeOffset occurredAt)
        => new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            Action = action,
            Method = method,
            Path = path,
            StatusCode = statusCode,
            CorrelationId = correlationId,
            IpAddress = ipAddress,
            OccurredAt = occurredAt,
        };
}
