namespace Slotly.Domain.Common;

public interface ITenantOwned
{
    Guid TenantId { get; }
}
