using Microsoft.EntityFrameworkCore;
using Slotly.Application.Common.Interfaces;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Infrastructure.Notifications;

public sealed class BookingNotificationService(
    SlotlyDbContext dbContext,
    IEmailSender emailSender,
    TimeProvider timeProvider)
{
    public async Task SendAsync(
        string idempotencyKey,
        Guid bookingId,
        NotificationKind kind,
        DateTimeOffset startsAt,
        CancellationToken cancellationToken = default)
    {
        var details = await dbContext.Bookings.IgnoreQueryFilters()
            .Where(booking => booking.Id == bookingId)
            .Join(
                dbContext.Customers.IgnoreQueryFilters(),
                booking => new { booking.TenantId, Id = booking.CustomerId },
                customer => new { customer.TenantId, customer.Id },
                (booking, customer) => new { Booking = booking, Customer = customer })
            .Join(
                dbContext.Services.IgnoreQueryFilters(),
                value => new { value.Booking.TenantId, Id = value.Booking.ServiceId },
                service => new { service.TenantId, service.Id },
                (value, service) => new
                {
                    value.Booking.TenantId,
                    value.Booking.Id,
                    CustomerName = value.Customer.Name,
                    CustomerEmail = value.Customer.Email,
                    ServiceName = service.Name,
                })
            .SingleAsync(cancellationToken);

        var message = kind switch
        {
            NotificationKind.Confirmation => BookingEmailTemplates.Confirmation(
                details.CustomerEmail, details.CustomerName, details.ServiceName, startsAt),
            NotificationKind.Cancellation => BookingEmailTemplates.Cancellation(
                details.CustomerEmail, details.CustomerName, details.ServiceName, startsAt),
            NotificationKind.Reschedule => BookingEmailTemplates.Reschedule(
                details.CustomerEmail, details.CustomerName, details.ServiceName, startsAt),
            NotificationKind.Reminder24Hours => BookingEmailTemplates.Reminder(
                details.CustomerEmail, details.CustomerName, details.ServiceName, startsAt, 24),
            NotificationKind.Reminder1Hour => BookingEmailTemplates.Reminder(
                details.CustomerEmail, details.CustomerName, details.ServiceName, startsAt, 1),
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unsupported notification kind."),
        };

        var delivery = NotificationDelivery.Reserve(
            details.TenantId,
            details.Id,
            idempotencyKey,
            message.To,
            message.Subject,
            timeProvider.GetUtcNow());
        dbContext.NotificationDeliveries.Add(delivery);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            dbContext.Entry(delivery).State = EntityState.Detached;
            return;
        }

        try
        {
            await emailSender.SendAsync(message, cancellationToken);
            delivery.MarkSent(timeProvider.GetUtcNow());
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            dbContext.NotificationDeliveries.Remove(delivery);
            await dbContext.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }
}

public enum NotificationKind
{
    Confirmation,
    Cancellation,
    Reschedule,
    Reminder24Hours,
    Reminder1Hour,
}
