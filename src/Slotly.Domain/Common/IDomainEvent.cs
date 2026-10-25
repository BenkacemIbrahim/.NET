namespace Slotly.Domain.Common;

public interface IDomainEvent
{
    Guid TenantId { get; }
}
