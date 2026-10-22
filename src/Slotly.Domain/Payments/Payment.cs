using Slotly.Domain.Common;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Payments;

public sealed class Payment : Entity, ITenantOwned
{
    private decimal _amount;
    private string _currency = string.Empty;

    private Payment()
    {
    }

    private Payment(Guid tenantId, Guid bookingId, Money amount)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        BookingId = DomainGuard.NotEmpty(bookingId, nameof(bookingId));
        SetAmount(amount);
        Status = PaymentStatus.Pending;
    }

    public Guid TenantId { get; private set; }

    public Guid BookingId { get; private set; }

    public Money Amount => new(_amount, _currency);

    public PaymentStatus Status { get; private set; }

    public string? ProviderReference { get; private set; }

    public DateTimeOffset? PaidAt { get; private set; }

    public static Payment Create(Guid tenantId, Guid bookingId, Money amount)
        => new(tenantId, bookingId, amount);

    public void MarkSucceeded(string providerReference, DateTimeOffset paidAt)
    {
        if (Status != PaymentStatus.Pending)
        {
            throw new InvalidOperationException("Only pending payments can succeed.");
        }

        ProviderReference = DomainGuard.NotBlank(
            providerReference,
            nameof(providerReference),
            200);
        PaidAt = paidAt.ToUniversalTime();
        Status = PaymentStatus.Succeeded;
    }

    public void MarkFailed()
    {
        if (Status != PaymentStatus.Pending)
        {
            throw new InvalidOperationException("Only pending payments can fail.");
        }

        Status = PaymentStatus.Failed;
    }

    public void Refund()
    {
        if (Status != PaymentStatus.Succeeded)
        {
            throw new InvalidOperationException("Only successful payments can be refunded.");
        }

        Status = PaymentStatus.Refunded;
    }

    private void SetAmount(Money amount)
    {
        ArgumentNullException.ThrowIfNull(amount);
        if (amount.Amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "A payment must be positive.");
        }

        _amount = amount.Amount;
        _currency = amount.Currency;
    }
}
