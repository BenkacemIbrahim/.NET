namespace Slotly.Application.Common.Interfaces;

public interface ITenantContext
{
    Guid? TenantId { get; }
}
