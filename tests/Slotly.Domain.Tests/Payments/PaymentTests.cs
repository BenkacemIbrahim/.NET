using FluentAssertions;
using Slotly.Domain.Payments;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Tests.Payments;

public sealed class PaymentTests
{
    [Fact]
    public void SuccessfulPaymentCanBeRefunded()
    {
        var payment = Payment.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            new Money(350, "MAD"));

        payment.MarkSucceeded(
            "pi_test_20261022",
            new DateTimeOffset(2026, 10, 22, 14, 0, 0, TimeSpan.Zero));
        payment.Refund();

        payment.Status.Should().Be(PaymentStatus.Refunded);
    }

    [Fact]
    public void FailedPaymentCannotSucceedLater()
    {
        var payment = Payment.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            new Money(350, "MAD"));
        payment.MarkFailed();

        var act = () => payment.MarkSucceeded(
            "pi_test_20261022",
            DateTimeOffset.UtcNow);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void CheckoutAndPaymentIntentReferencesAreRetained()
    {
        var payment = Payment.Create(Guid.NewGuid(), Guid.NewGuid(), new Money(50, "EUR"));

        payment.AttachCheckoutSession("cs_test_123", null);
        payment.MarkSucceeded("pi_test_123", DateTimeOffset.UtcNow);

        payment.CheckoutSessionId.Should().Be("cs_test_123");
        payment.PaymentIntentId.Should().Be("pi_test_123");
        payment.Status.Should().Be(PaymentStatus.Succeeded);
    }
}
