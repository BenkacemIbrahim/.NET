using Slotly.Domain.Payments;

namespace Slotly.Application.Payments;

public sealed record PaymentPolicyRequest(bool OnlinePaymentsEnabled, decimal? DepositPercentage);

public sealed record PaymentPolicyDto(bool OnlinePaymentsEnabled, decimal? DepositPercentage);

public sealed record RefundPaymentRequest(Guid BookingVersion, string Reason);

public sealed record PaymentDto(
    Guid Id,
    Guid BookingId,
    decimal Amount,
    string Currency,
    PaymentStatus Status,
    string? CheckoutSessionId,
    string? PaymentIntentId,
    DateTimeOffset? PaidAt);
