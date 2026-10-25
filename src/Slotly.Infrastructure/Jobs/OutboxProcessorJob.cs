using System.Text.Json;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Slotly.Domain.Bookings;
using Slotly.Infrastructure.Notifications;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Infrastructure.Jobs;

public sealed partial class OutboxProcessorJob(
    SlotlyDbContext dbContext,
    BookingNotificationService notificationService,
    TimeProvider timeProvider,
    ILogger<OutboxProcessorJob> logger)
{
    [AutomaticRetry(Attempts = 5, DelaysInSeconds = [10, 30, 60, 180, 300], OnAttemptsExceeded = AttemptsExceededAction.Fail)]
    [DisableConcurrentExecution(timeoutInSeconds: 120)]
    public async Task ProcessAsync(CancellationToken cancellationToken)
    {
        var messages = await dbContext.OutboxMessages
            .Where(message => message.ProcessedAt == null)
            .OrderBy(message => message.OccurredAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var message in messages)
        {
            using (logger.BeginScope(new Dictionary<string, object>
            {
                ["CorrelationId"] = message.CorrelationId,
                ["OutboxMessageId"] = message.Id,
            }))
            {
                try
                {
                    await DispatchAsync(message, cancellationToken);
                    message.MarkProcessed(timeProvider.GetUtcNow());
                    await dbContext.SaveChangesAsync(cancellationToken);
                    LogProcessed(logger, message.Id, message.Type, message.CorrelationId);
                }
                catch (Exception exception)
                {
                    message.RecordFailure(exception.Message);
                    await dbContext.SaveChangesAsync(CancellationToken.None);
                    LogFailed(logger, exception, message.Id, message.Type, message.CorrelationId);
                    throw;
                }
            }
        }
    }

    private Task DispatchAsync(OutboxMessage message, CancellationToken cancellationToken)
        => message.Type switch
        {
            nameof(BookingCreated) => SendCreatedAsync(message, cancellationToken),
            nameof(BookingCancelled) => SendCancelledAsync(message, cancellationToken),
            nameof(BookingRescheduled) => SendRescheduledAsync(message, cancellationToken),
            _ => throw new InvalidOperationException($"Unknown outbox message type '{message.Type}'."),
        };

    private Task SendCreatedAsync(OutboxMessage message, CancellationToken cancellationToken)
    {
        var domainEvent = Deserialize<BookingCreated>(message);
        return notificationService.SendAsync(
            $"outbox:{message.Id}", domainEvent.BookingId, NotificationKind.Confirmation,
            domainEvent.StartsAt, cancellationToken);
    }

    private Task SendCancelledAsync(OutboxMessage message, CancellationToken cancellationToken)
    {
        var domainEvent = Deserialize<BookingCancelled>(message);
        return notificationService.SendAsync(
            $"outbox:{message.Id}", domainEvent.BookingId, NotificationKind.Cancellation,
            domainEvent.StartsAt, cancellationToken);
    }

    private Task SendRescheduledAsync(OutboxMessage message, CancellationToken cancellationToken)
    {
        var domainEvent = Deserialize<BookingRescheduled>(message);
        return notificationService.SendAsync(
            $"outbox:{message.Id}", domainEvent.BookingId, NotificationKind.Reschedule,
            domainEvent.StartsAt, cancellationToken);
    }

    private static T Deserialize<T>(OutboxMessage message)
        => JsonSerializer.Deserialize<T>(message.Payload)
            ?? throw new InvalidOperationException($"Outbox message {message.Id} has an invalid payload.");

    [LoggerMessage(10, LogLevel.Information, "Processed outbox message {MessageId} ({MessageType}) with correlation {CorrelationId}.")]
    private static partial void LogProcessed(ILogger logger, Guid messageId, string messageType, string correlationId);

    [LoggerMessage(11, LogLevel.Error, "Failed outbox message {MessageId} ({MessageType}) with correlation {CorrelationId}.")]
    private static partial void LogFailed(ILogger logger, Exception exception, Guid messageId, string messageType, string correlationId);
}
