using System.Globalization;
using Microsoft.Extensions.Options;
using Slotly.Application.Common.Interfaces;
using Stripe;
using Stripe.Checkout;

namespace Slotly.Infrastructure.Payments;

internal sealed class StripePaymentGateway(IOptions<StripeOptions> options) : IPaymentGateway
{
    private readonly StripeOptions _options = options.Value;

    public async Task<CheckoutResult> CreateCheckoutAsync(
        CheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureSecretKey();
        var metadata = new Dictionary<string, string>
        {
            ["tenant_id"] = request.TenantId.ToString(),
            ["booking_id"] = request.BookingId.ToString(),
            ["payment_id"] = request.PaymentId.ToString(),
        };
        var createOptions = new SessionCreateOptions
        {
            Mode = "payment",
            CustomerEmail = request.CustomerEmail,
            SuccessUrl = $"{_options.SuccessUrl}?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = _options.CancelUrl,
            Metadata = metadata,
            PaymentIntentData = new SessionPaymentIntentDataOptions { Metadata = metadata },
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = request.Currency.ToLowerInvariant(),
                        UnitAmount = checked((long)(request.Amount * 100m)),
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = request.ServiceName,
                        },
                    },
                },
            ],
        };
        var session = await new SessionService(new StripeClient(_options.SecretKey))
            .CreateAsync(createOptions, cancellationToken: cancellationToken);
        return new CheckoutResult(
            session.Id,
            session.Url ?? throw new InvalidOperationException("Stripe did not return a checkout URL."),
            session.PaymentIntentId);
    }

    public async Task RefundAsync(string paymentIntentId, CancellationToken cancellationToken = default)
    {
        EnsureSecretKey();
        await new RefundService(new StripeClient(_options.SecretKey)).CreateAsync(
            new RefundCreateOptions { PaymentIntent = paymentIntentId },
            cancellationToken: cancellationToken);
    }

    public PaymentWebhook ParseWebhook(string payload, string signature)
    {
        if (string.IsNullOrWhiteSpace(_options.WebhookSecret))
        {
            throw new InvalidOperationException("Stripe webhook secret is not configured.");
        }

        var stripeEvent = EventUtility.ConstructEvent(payload, signature, _options.WebhookSecret);
        return stripeEvent.Type switch
        {
            EventTypes.CheckoutSessionCompleted when stripeEvent.Data.Object is Session session
                => new PaymentWebhook(stripeEvent.Id, PaymentWebhookKind.CheckoutCompleted, session.Id, session.PaymentIntentId),
            EventTypes.PaymentIntentPaymentFailed when stripeEvent.Data.Object is PaymentIntent paymentIntent
                => new PaymentWebhook(stripeEvent.Id, PaymentWebhookKind.PaymentFailed, null, paymentIntent.Id),
            EventTypes.ChargeRefunded when stripeEvent.Data.Object is Charge charge
                => new PaymentWebhook(stripeEvent.Id, PaymentWebhookKind.ChargeRefunded, null, charge.PaymentIntentId),
            _ => throw new NotSupportedException(string.Format(
                CultureInfo.InvariantCulture,
                "Stripe event type '{0}' is not handled.",
                stripeEvent.Type)),
        };
    }

    private void EnsureSecretKey()
    {
        if (!_options.SecretKey.StartsWith("sk_test_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("A Stripe test secret key is required for payment operations.");
        }
    }
}
