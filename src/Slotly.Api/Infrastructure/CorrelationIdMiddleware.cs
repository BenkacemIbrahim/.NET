using Serilog.Context;
using Slotly.Application.Common.Interfaces;

namespace Slotly.Api.Infrastructure;

internal sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext httpContext, ICorrelationContext correlationContext)
    {
        var supplied = httpContext.Request.Headers[HeaderName].FirstOrDefault();
        var correlationId = !string.IsNullOrWhiteSpace(supplied) && supplied.Length <= 128
            ? supplied
            : httpContext.TraceIdentifier;
        correlationContext.CorrelationId = correlationId;
        httpContext.Response.Headers[HeaderName] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(httpContext);
        }
    }
}
