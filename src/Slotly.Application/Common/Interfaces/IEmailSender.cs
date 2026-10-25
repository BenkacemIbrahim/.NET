namespace Slotly.Application.Common.Interfaces;

public sealed record EmailMessage(
    string To,
    string Subject,
    string PlainTextBody,
    string HtmlBody);

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}
