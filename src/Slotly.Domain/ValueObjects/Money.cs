namespace Slotly.Domain.ValueObjects;

public sealed record Money
{
    public Money(decimal amount, string currency)
    {
        if (amount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Money cannot be negative.");
        }

        ArgumentNullException.ThrowIfNull(currency);
        var normalizedCurrency = currency.Trim().ToUpperInvariant();
        if (normalizedCurrency.Length != 3 || !normalizedCurrency.All(char.IsLetter))
        {
            throw new ArgumentException(
                "Currency must be a three-letter ISO currency code.",
                nameof(currency));
        }

        Amount = decimal.Round(amount, 2, MidpointRounding.ToEven);
        Currency = normalizedCurrency;
    }

    public decimal Amount { get; }

    public string Currency { get; }
}
