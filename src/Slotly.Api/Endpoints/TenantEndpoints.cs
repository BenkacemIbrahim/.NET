using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Slotly.Api.Infrastructure;
using Slotly.Application.Common.Interfaces;
using Slotly.Application.Management;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Api.Endpoints;

public static class TenantEndpoints
{
    public static IEndpointRouteBuilder MapTenantEndpoints(this IEndpointRouteBuilder routes)
    {
        routes.MapGet("/api/v1/public/tenant", GetPublicTenantAsync)
            .AllowAnonymous()
            .Produces<TenantSettingsDto>()
            .RequireRateLimiting("tenant-api")
            .WithTags("Tenant settings")
            .WithName("GetPublicTenant")
            .WithSummary("Returns public branding and booking settings for the resolved tenant.");

        var settings = routes.MapGroup("/api/v1/settings")
            .WithTags("Tenant settings")
            .RequireRateLimiting("tenant-api")
            .RequireAuthorization(AuthorizationPolicies.ActiveTenantOnly);
        settings.MapGet("/", GetSettingsAsync)
            .Produces<TenantSettingsDto>()
            .WithName("GetTenantSettings")
            .WithSummary("Returns settings for the active tenant.");
        settings.MapPut("/", UpdateSettingsAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .Produces<TenantSettingsDto>()
            .WithName("UpdateTenantSettings")
            .WithSummary("Updates tenant identity, booking policy, and public branding.");
        return routes;
    }

    private static async Task<IResult> GetPublicTenantAsync(
        ITenantContext tenantContext,
        TenantSettingsCache cache,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (tenantContext.TenantId is not { } tenantId)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Tenant required",
                detail: "Resolve a tenant with the X-Tenant header or a tenant subdomain.");
        }

        var value = await cache.GetAsync(tenantId, dbContext, cancellationToken);
        return Results.Ok(new TenantSettingsDto(
            tenantId,
            value.Name,
            value.Slug,
            value.TimeZoneId,
            value.CancellationWindowHours,
            value.PrimaryColor,
            value.LogoUrl,
            value.OnlinePaymentsEnabled,
            value.DepositPercentage));
    }

    private static async Task<IResult> GetSettingsAsync(
        ITenantContext tenantContext,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants.AsNoTracking().SingleAsync(
            value => value.Id == RequiredTenantId(tenantContext), cancellationToken);
        return Results.Ok(ToDto(tenant));
    }

    private static async Task<IResult> UpdateSettingsAsync(
        [FromBody] TenantSettingsRequest request,
        ITenantContext tenantContext,
        SlotlyDbContext dbContext,
        TenantSettingsCache cache,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 200)
        {
            return Validation(nameof(request.Name), "The tenant name is required and cannot exceed 200 characters.");
        }

        try
        {
            _ = TimeZoneInfo.FindSystemTimeZoneById(request.TimeZoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            return Validation(nameof(request.TimeZoneId), "The time zone is not installed on this host.");
        }

        var tenant = await dbContext.Tenants.SingleAsync(
            value => value.Id == RequiredTenantId(tenantContext), cancellationToken);
        try
        {
            tenant.Rename(request.Name);
            tenant.ConfigureBookingPolicy(request.TimeZoneId, request.CancellationWindowHours);
            tenant.ConfigureBranding(request.PrimaryColor, request.LogoUrl);
        }
        catch (ArgumentException exception)
        {
            return Validation("settings", exception.Message);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await cache.InvalidateAsync(tenant.Id, cancellationToken);
        return Results.Ok(ToDto(tenant));
    }

    private static TenantSettingsDto ToDto(Domain.Tenants.Tenant tenant)
        => new(
            tenant.Id,
            tenant.Name,
            tenant.Slug,
            tenant.TimeZoneId,
            tenant.CancellationWindowHours,
            tenant.PrimaryColor,
            tenant.LogoUrl,
            tenant.OnlinePaymentsEnabled,
            tenant.DepositPercentage);

    private static Guid RequiredTenantId(ITenantContext tenantContext)
        => tenantContext.TenantId
            ?? throw new InvalidOperationException("An active tenant is required.");

    private static IResult Validation(string key, string message)
        => Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [message] });
}
