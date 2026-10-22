using Microsoft.AspNetCore.Mvc;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Api.Infrastructure;

public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Tenant-Id";

    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext)
    {
        if (context.Request.Headers.TryGetValue(HeaderName, out var values))
        {
            if (values.Count != 1
                || !Guid.TryParse(values[0], out var tenantId)
                || tenantId == Guid.Empty)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Invalid tenant identifier",
                    Detail = $"The {HeaderName} header must contain one non-empty GUID.",
                });
                return;
            }

            tenantContext.SetTenant(tenantId);
        }

        await next(context);
    }
}
