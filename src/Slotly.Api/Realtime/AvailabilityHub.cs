using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Slotly.Application.Common.Interfaces;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Api.Realtime;

[Authorize(Policy = AuthorizationPolicies.CustomerOnly)]
public sealed class AvailabilityHub(
    ITenantContext tenantContext,
    SlotlyDbContext dbContext) : Hub
{
    public async Task Subscribe(Guid serviceId, DateOnly date, CancellationToken cancellationToken)
    {
        var tenantId = tenantContext.TenantId
            ?? throw new HubException("An active tenant is required.");
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

    public Task Unsubscribe(Guid serviceId, DateOnly date, CancellationToken cancellationToken)
    {
        var tenantId = tenantContext.TenantId
            ?? throw new HubException("An active tenant is required.");
        return Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            AvailabilityGroups.For(tenantId, serviceId, date),
            cancellationToken);
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
