using System.Net.Sockets;
using Hangfire;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Slotly.Infrastructure.Notifications;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Api.Infrastructure;

internal sealed class PostgreSqlHealthCheck(SlotlyDbContext dbContext) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
        => await dbContext.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy("PostgreSQL is reachable.")
            : HealthCheckResult.Unhealthy("PostgreSQL is unavailable.");
}

internal sealed class HangfireHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var servers = JobStorage.Current.GetMonitoringApi().Servers();
            return Task.FromResult(servers.Count > 0
                ? HealthCheckResult.Healthy("Hangfire server is active.")
                : HealthCheckResult.Unhealthy("No Hangfire server is active."));
        }
        catch (Exception exception)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("Hangfire storage is unavailable.", exception));
        }
    }
}

internal sealed class SmtpHealthCheck(IOptions<SmtpOptions> options) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(options.Value.Host, options.Value.Port, cancellationToken);
            return HealthCheckResult.Healthy("SMTP is reachable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("SMTP is unavailable.", exception);
        }
    }
}
