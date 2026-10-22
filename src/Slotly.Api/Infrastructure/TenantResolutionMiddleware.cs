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
                await Results.Problem(
                        statusCode: StatusCodes.Status400BadRequest,
                        title: "Invalid tenant identifier",
                        detail: $"The {HeaderName} header must contain one non-empty GUID.")
                    .ExecuteAsync(context);
                return;
            }

            tenantContext.SetTenant(tenantId);
        }

        await next(context);
    }
}
