using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Serilog.Context;
using Slotly.Application.Common.Interfaces;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Api.Infrastructure;

internal sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "no-referrer";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";
            return Task.CompletedTask;
        });
        await next(context);
    }
}

internal sealed class RequestIdentityLogMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
        var tenantId = tenantContext.TenantId?.ToString() ?? "none";
        using (LogContext.PushProperty("TenantId", tenantId))
        using (LogContext.PushProperty("UserId", userId))
        {
            await next(context);
        }
    }
}

internal sealed partial class AuditLogMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        SlotlyDbContext dbContext,
        ITenantContext tenantContext,
        TimeProvider timeProvider,
        ILogger<AuditLogMiddleware> logger)
    {
        await next(context);
        if (context.Request.Method is not ("POST" or "PUT" or "PATCH" or "DELETE")
            || context.Response.StatusCode >= 500)
        {
            return;
        }

        Guid? userId = Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsed)
            ? parsed
            : null;
        dbContext.AuditLogs.Add(AuditLog.Create(
            tenantContext.TenantId,
            userId,
            context.GetEndpoint()?.DisplayName ?? "HTTP mutation",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            context.Response.Headers[CorrelationIdMiddleware.HeaderName].FirstOrDefault() ?? context.TraceIdentifier,
            context.Connection.RemoteIpAddress?.ToString(),
            timeProvider.GetUtcNow()));
        try
        {
            await dbContext.SaveChangesAsync(context.RequestAborted);
        }
        catch (Exception exception) when (exception is DbUpdateException or InvalidOperationException)
        {
            LogAuditFailure(logger, exception, context.Request.Method, context.Request.Path);
        }
    }

    [LoggerMessage(20, LogLevel.Warning, "Failed to persist audit log for {Method} {Path}.")]
    private static partial void LogAuditFailure(ILogger logger, Exception exception, string method, string path);
}
