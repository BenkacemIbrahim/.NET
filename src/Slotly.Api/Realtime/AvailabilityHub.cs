using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Api.Realtime;

[Authorize(Policy = AuthorizationPolicies.CustomerOnly)]
public sealed class AvailabilityHub(
    TenantContext tenantContext,
    SlotlyDbContext dbContext) : Hub
{
    public async Task Subscribe(Guid serviceId, DateOnly date)
    {
        var cancellationToken = Context.ConnectionAborted;
        var tenantId = ResolveTenant();
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

    public Task Unsubscribe(Guid serviceId, DateOnly date)
    {
        var tenantId = ResolveTenant();
        return Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            AvailabilityGroups.For(tenantId, serviceId, date),
            Context.ConnectionAborted);
    }

    private Guid ResolveTenant()
    {
        if (tenantContext.TenantId is { } resolvedTenantId)
        {
            return resolvedTenantId;
        }

        if (!Guid.TryParse(Context.User?.FindFirst("tenant_id")?.Value, out var claimedTenantId)
            || claimedTenantId == Guid.Empty)
        {
            throw new HubException("An active tenant is required.");
        }

        tenantContext.SetTenant(claimedTenantId);
        return claimedTenantId;
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
