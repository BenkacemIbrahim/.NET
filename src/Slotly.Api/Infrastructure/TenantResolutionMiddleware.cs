using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Slotly.Domain.Users;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Api.Infrastructure;

public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Tenant-Id";
    public const string AltHeaderName = "X-Tenant";

    private static readonly HashSet<string> ReservedSubdomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "api", "app", "www", "admin", "mail", "localhost", "slotly"
    };

    public async Task InvokeAsync(
        HttpContext context,
        TenantContext tenantContext,
        SlotlyDbContext dbContext,
        IOptions<TenancyOptions> options)
    {
        var tenancy = options.Value;
        Guid? resolvedTenantId = null;

        if (tenancy.EnableHeaderResolution)
        {
            if (context.Request.Headers.TryGetValue(HeaderName, out var values))
            {
                if (values.Count != 1
                    || !Guid.TryParse(values[0], out var parsedId)
                    || parsedId == Guid.Empty)
                {
                    await Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Invalid tenant identifier",
                            detail: $"The {HeaderName} header must contain one non-empty GUID.")
                        .ExecuteAsync(context);
                    return;
                }

                resolvedTenantId = parsedId;
            }
            else if (context.Request.Headers.TryGetValue(AltHeaderName, out var altValues))
            {
                if (altValues.Count != 1 || string.IsNullOrWhiteSpace(altValues[0]))
                {
                    await Results.Problem(
                            statusCode: StatusCodes.Status400BadRequest,
                            title: "Invalid tenant identifier",
                            detail: $"The {AltHeaderName} header must contain exactly one value.")
                        .ExecuteAsync(context);
                    return;
                }

                var rawValue = altValues[0]!.Trim();
                if (Guid.TryParse(rawValue, out var parsedAltId))
                {
                    if (parsedAltId == Guid.Empty)
                    {
                        await Results.Problem(
                                statusCode: StatusCodes.Status400BadRequest,
                                title: "Invalid tenant identifier",
                                detail: $"The {AltHeaderName} header must not contain an empty GUID.")
                            .ExecuteAsync(context);
                        return;
                    }

                    resolvedTenantId = parsedAltId;
                }
                else
                {
                    var slug = rawValue.ToLowerInvariant();
                    var tenant = await dbContext.Tenants
                        .AsNoTracking()
                        .SingleOrDefaultAsync(t => t.Slug == slug && t.IsActive, context.RequestAborted);

                    if (tenant is null)
                    {
                        await Results.Problem(
                                statusCode: StatusCodes.Status404NotFound,
                                title: "Tenant not found",
                                detail: $"Tenant with slug '{rawValue}' was not found or is inactive.")
                            .ExecuteAsync(context);
                        return;
                    }

                    resolvedTenantId = tenant.Id;
                }
            }
        }

        if (!resolvedTenantId.HasValue && tenancy.EnableSubdomainResolution)
        {
            var host = context.Request.Host.Host;
            var subdomain = ExtractSubdomain(host, tenancy.BaseDomain);

            if (!string.IsNullOrWhiteSpace(subdomain) && !ReservedSubdomains.Contains(subdomain))
            {
                var slug = subdomain.ToLowerInvariant();
                var tenant = await dbContext.Tenants
                    .AsNoTracking()
                    .SingleOrDefaultAsync(t => t.Slug == slug && t.IsActive, context.RequestAborted);

                if (tenant is null)

                {
                    await Results.Problem(
                            statusCode: StatusCodes.Status404NotFound,
                            title: "Tenant not found",
                            detail: $"Tenant with subdomain '{subdomain}' was not found or is inactive.")
                        .ExecuteAsync(context);
                    return;
                }

                resolvedTenantId = tenant.Id;
            }
        }

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(tenantClaim, out var userTenantId))
            {
                var isPlatformAdmin = context.User.IsInRole(UserRole.PlatformAdmin.ToString());
                if (!isPlatformAdmin)
                {
                    if (resolvedTenantId.HasValue && resolvedTenantId.Value != userTenantId)
                    {
                        await Results.Problem(
                                statusCode: StatusCodes.Status403Forbidden,
                                title: "Tenant Access Forbidden",
                                detail: $"Authenticated user belongs to tenant '{userTenantId}' and cannot access tenant '{resolvedTenantId.Value}'.")
                            .ExecuteAsync(context);
                        return;
                    }

                    resolvedTenantId ??= userTenantId;
                }
            }
        }

        if (resolvedTenantId.HasValue)
        {
            tenantContext.SetTenant(resolvedTenantId.Value);
        }

        await next(context);
    }

    private static string? ExtractSubdomain(string host, string baseDomain)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        if (host.EndsWith("." + baseDomain, StringComparison.OrdinalIgnoreCase))
        {
            var prefix = host[..^(baseDomain.Length + 1)];
            var parts = prefix.Split('.');
            return parts[^1];
        }

        if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase))
        {
            var prefix = host[..^".localhost".Length];
            var parts = prefix.Split('.');
            return parts[^1];
        }

        return null;
    }
}
