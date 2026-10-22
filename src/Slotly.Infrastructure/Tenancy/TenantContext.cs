using Slotly.Application.Common.Interfaces;

namespace Slotly.Infrastructure.Tenancy;

public sealed class TenantContext : ITenantContext
{
    public Guid? TenantId { get; private set; }

    public void SetTenant(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("The tenant identifier cannot be empty.", nameof(tenantId));
        }

        TenantId = tenantId;
    }

    public void Clear() => TenantId = null;
}
