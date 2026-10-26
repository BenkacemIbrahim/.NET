using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Api.Realtime;

[AllowAnonymous]
public sealed class AvailabilityHub(
    TenantContext tenantContext,
    SlotlyDbContext dbContext) : Hub
{
    public async Task Subscribe(Guid serviceId, DateOnly date)
    {
        var cancellationToken = Context.ConnectionAborted;
        var tenantId = await ResolveTenantAsync(cancellationToken);
        if (!await dbContext.Services.AsNoTracking().AnyAsync(
                service => service.Id == serviceId && service.IsActive,
                cancellationToken))
        {
            throw new HubException("The service was not found.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            AvailabilityGroups.For(tenantId, serviceId, date),
            cancellationToken);
    }

    public async Task Unsubscribe(Guid serviceId, DateOnly date)
    {
        var tenantId = await ResolveTenantAsync(Context.ConnectionAborted);
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            AvailabilityGroups.For(tenantId, serviceId, date),
            Context.ConnectionAborted);
    }

    private async Task<Guid> ResolveTenantAsync(CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId is { } resolvedTenantId)
        {
            return resolvedTenantId;
        }

        if (Guid.TryParse(Context.User?.FindFirst("tenant_id")?.Value, out var claimedTenantId)
            && claimedTenantId != Guid.Empty)
        {
            tenantContext.SetTenant(claimedTenantId);
            return claimedTenantId;
        }

        var tenantSlug = Context.GetHttpContext()?.Request.Query["tenant"].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(tenantSlug))
        {
            throw new HubException("A tenant slug is required.");
        }

        var tenant = await dbContext.Tenants.IgnoreQueryFilters().AsNoTracking()
            .SingleOrDefaultAsync(value => value.Slug == tenantSlug && value.IsActive, cancellationToken)
            ?? throw new HubException("The tenant was not found.");
        tenantContext.SetTenant(tenant.Id);
        return tenant.Id;
    }
}

public static class AvailabilityGroups
{
    public static string For(Guid tenantId, Guid serviceId, DateOnly date)
        => $"tenant:{tenantId:N}:service:{serviceId:N}:date:{date:yyyy-MM-dd}";
}

public sealed record SlotChangedMessage(
    Guid BookingId,
    Guid ServiceId,
    Guid StaffId,
    DateOnly Date,
    string Change,
    DateTimeOffset StartsAt);
