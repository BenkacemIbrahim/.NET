using System.Globalization;
using System.Net;
using Slotly.Application.Common.Interfaces;

namespace Slotly.Infrastructure.Notifications;

internal static class BookingEmailTemplates
{
    public static EmailMessage Confirmation(string email, string customer, string service, DateTimeOffset startsAt)
        => Build(email, "Booking confirmed", customer, $"Your {service} booking is confirmed for {Format(startsAt)}.");

    public static EmailMessage Cancellation(string email, string customer, string service, DateTimeOffset startsAt)
        => Build(email, "Booking cancelled", customer, $"Your {service} booking for {Format(startsAt)} has been cancelled.");

    public static EmailMessage Reschedule(string email, string customer, string service, DateTimeOffset startsAt)
        => Build(email, "Booking rescheduled", customer, $"Your {service} booking has moved to {Format(startsAt)}.");

    public static EmailMessage Reminder(string email, string customer, string service, DateTimeOffset startsAt, int hours)
        => Build(email, $"Booking reminder: {hours} hour{(hours == 1 ? string.Empty : "s")}", customer,
            $"Your {service} booking starts at {Format(startsAt)}.");

    private static EmailMessage Build(string email, string subject, string customer, string body)
    {
        var safeCustomer = WebUtility.HtmlEncode(customer);
        var safeBody = WebUtility.HtmlEncode(body);
        return new EmailMessage(
            email,
            subject,
            $"Hello {customer},\n\n{body}\n\nSlotly",
            $"<html><body><p>Hello {safeCustomer},</p><p>{safeBody}</p><p>Slotly</p></body></html>");
    }

    private static string Format(DateTimeOffset value)
        => value.ToString("yyyy-MM-dd HH:mm 'UTC'zzz", CultureInfo.InvariantCulture);
}
