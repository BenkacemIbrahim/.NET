namespace Slotly.Application.Common.Interfaces;

public sealed record CheckoutRequest(
    Guid TenantId,
    Guid BookingId,
    Guid PaymentId,
    string ServiceName,
    decimal Amount,
    string Currency,
    string CustomerEmail);

public sealed record CheckoutResult(
    string SessionId,
    string Url,
    string? PaymentIntentId);

public enum PaymentWebhookKind
{
    CheckoutCompleted,
    PaymentFailed,
    ChargeRefunded,
}

public sealed record PaymentWebhook(
    string EventId,
    PaymentWebhookKind Kind,
    string? CheckoutSessionId,
    string? PaymentIntentId);

public interface IPaymentGateway
{
    Task<CheckoutResult> CreateCheckoutAsync(
        CheckoutRequest request,
        CancellationToken cancellationToken = default);

    Task RefundAsync(string paymentIntentId, CancellationToken cancellationToken = default);

    PaymentWebhook ParseWebhook(string payload, string signature);
}
