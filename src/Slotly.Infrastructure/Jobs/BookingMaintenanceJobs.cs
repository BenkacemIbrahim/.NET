using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Slotly.Application.Common.Interfaces;
using Slotly.Domain.Bookings;
using Slotly.Infrastructure.Notifications;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Infrastructure.Jobs;

public sealed class BookingMaintenanceJobs(
    SlotlyDbContext dbContext,
    BookingNotificationService notificationService,
    TenantContext tenantContext,
    ICorrelationContext correlationContext,
    IOptions<BackgroundJobOptions> options,
    TimeProvider timeProvider)
{
    private readonly BackgroundJobOptions _options = options.Value;

    [AutomaticRetry(Attempts = 5, DelaysInSeconds = [10, 30, 60, 180, 300])]
    [DisableConcurrentExecution(timeoutInSeconds: 120)]
    public Task SendRemindersAsync(CancellationToken cancellationToken)
        => SendDueRemindersAsync(cancellationToken);

    [AutomaticRetry(Attempts = 5, DelaysInSeconds = [10, 30, 60, 180, 300])]
    [DisableConcurrentExecution(timeoutInSeconds: 120)]
    public async Task ExpirePendingBookingsAsync(CancellationToken cancellationToken)
    {
        var cutoff = timeProvider.GetUtcNow().AddMinutes(-_options.PendingBookingExpiryMinutes);
        var bookings = await dbContext.Bookings.IgnoreQueryFilters()
            .Where(booking => booking.Status == BookingStatus.Pending && booking.CreatedAt <= cutoff)
            .OrderBy(booking => booking.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var booking in bookings)
        {
            tenantContext.SetTenant(booking.TenantId);
            correlationContext.CorrelationId = $"job:expire:{booking.Id:N}";
            booking.Cancel("Unpaid booking expired.");
            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
        }
    }

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [30, 120, 300])]
    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    public async Task CleanupAsync(CancellationToken cancellationToken)
    {
        var cutoff = timeProvider.GetUtcNow().AddDays(-_options.RetentionDays);
        await dbContext.RefreshTokens.IgnoreQueryFilters()
            .Where(token => token.ExpiresAt < cutoff || (token.RevokedAt != null && token.RevokedAt < cutoff))
            .ExecuteDeleteAsync(cancellationToken);
        await dbContext.OutboxMessages
            .Where(message => message.ProcessedAt != null && message.ProcessedAt < cutoff)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private async Task SendDueRemindersAsync(CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var candidates = await dbContext.Bookings.IgnoreQueryFilters()
            .Where(booking => booking.Status == BookingStatus.Confirmed
                && EF.Property<DateTimeOffset>(booking, "_startsAt") > now
                && EF.Property<DateTimeOffset>(booking, "_startsAt") <= now.AddHours(24))
            .Select(booking => new { booking.Id, StartsAt = EF.Property<DateTimeOffset>(booking, "_startsAt") })
            .ToListAsync(cancellationToken);

        foreach (var booking in candidates)
        {
            await notificationService.SendAsync(
                $"reminder:24:{booking.Id:N}", booking.Id, NotificationKind.Reminder24Hours,
                booking.StartsAt, cancellationToken);
            if (booking.StartsAt <= now.AddHours(1))
            {
                await notificationService.SendAsync(
                    $"reminder:1:{booking.Id:N}", booking.Id, NotificationKind.Reminder1Hour,
                    booking.StartsAt, cancellationToken);
            }
        }
    }
}
