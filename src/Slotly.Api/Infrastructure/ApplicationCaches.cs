using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using Slotly.Application.Bookings;
using Slotly.Domain.Tenants;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Api.Infrastructure;

public sealed class AvailabilityCache(HybridCache cache)
{
    public ValueTask<AvailabilityDto[]> GetOrCreateAsync(
        Guid tenantId,
        Guid serviceId,
        Guid? staffId,
        DateOnly startsOn,
        DateOnly endsOn,
        Func<CancellationToken, ValueTask<AvailabilityDto[]>> factory,
        CancellationToken cancellationToken)
        => cache.GetOrCreateAsync(
            Key(tenantId, serviceId, staffId, startsOn, endsOn),
            factory,
            new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(2),
                LocalCacheExpiration = TimeSpan.FromSeconds(30),
            },
            [TenantTag(tenantId), ServiceTag(tenantId, serviceId)],
            cancellationToken);

    public ValueTask InvalidateTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => cache.RemoveByTagAsync(TenantTag(tenantId), cancellationToken);

    public ValueTask InvalidateServiceAsync(Guid tenantId, Guid serviceId, CancellationToken cancellationToken = default)
        => cache.RemoveByTagAsync(ServiceTag(tenantId, serviceId), cancellationToken);

    private static string Key(Guid tenantId, Guid serviceId, Guid? staffId, DateOnly startsOn, DateOnly endsOn)
        => $"availability:{tenantId:N}:{serviceId:N}:{staffId?.ToString("N") ?? "any"}:{startsOn:yyyyMMdd}:{endsOn:yyyyMMdd}";

    private static string TenantTag(Guid tenantId) => $"tenant:{tenantId:N}:availability";

    private static string ServiceTag(Guid tenantId, Guid serviceId) => $"tenant:{tenantId:N}:service:{serviceId:N}";
}

public sealed record TenantSettings(
    string Name,
    string Slug,
    string TimeZoneId,
    int CancellationWindowHours,
    string PrimaryColor,
    string? LogoUrl,
    bool OnlinePaymentsEnabled,
    decimal? DepositPercentage);

public sealed class TenantSettingsCache(HybridCache cache)
{
    public ValueTask<TenantSettings> GetAsync(
        Guid tenantId,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
        => cache.GetOrCreateAsync(
            $"tenant-settings:{tenantId:N}",
            async token =>
            {
                var tenant = await dbContext.Tenants.AsNoTracking()
                    .SingleAsync(value => value.Id == tenantId, token);
                return new TenantSettings(
                    tenant.Name,
                    tenant.Slug,
                    tenant.TimeZoneId,
                    tenant.CancellationWindowHours,
                    tenant.PrimaryColor,
                    tenant.LogoUrl,
                    tenant.OnlinePaymentsEnabled,
                    tenant.DepositPercentage);
            },
            new HybridCacheEntryOptions { Expiration = TimeSpan.FromMinutes(5) },
            [$"tenant:{tenantId:N}:settings"],
            cancellationToken);

    public ValueTask InvalidateAsync(Guid tenantId, CancellationToken cancellationToken = default)
        => cache.RemoveByTagAsync($"tenant:{tenantId:N}:settings", cancellationToken);
}
