namespace Slotly.Infrastructure.Payments;

public sealed class StripeOptions
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; set; } = string.Empty;

    public string WebhookSecret { get; set; } = string.Empty;

    public string SuccessUrl { get; set; } = "http://localhost:8080/payments/success";

    public string CancelUrl { get; set; } = "http://localhost:8080/payments/cancel";
}
