using Slotly.Domain.Common;

namespace Slotly.Domain.Tenants;

public sealed class Tenant : Entity
{
    private Tenant()
    {
    }

    private Tenant(string name, string slug)
    {
        Name = DomainGuard.NotBlank(name, nameof(name), 200);
        Slug = NormalizeSlug(slug);
        TimeZoneId = "UTC";
        CancellationWindowHours = 24;
        IsActive = true;
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public string TimeZoneId { get; private set; } = string.Empty;

    public int CancellationWindowHours { get; private set; }

    public bool OnlinePaymentsEnabled { get; private set; }

    public decimal? DepositPercentage { get; private set; }

    public static Tenant Create(string name, string slug) => new(name, slug);

    public void Rename(string name)
    {
        Name = DomainGuard.NotBlank(name, nameof(name), 200);
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public void ConfigureBookingPolicy(string timeZoneId, int cancellationWindowHours)
    {
        TimeZoneId = DomainGuard.NotBlank(timeZoneId, nameof(timeZoneId), 100);
        if (cancellationWindowHours is < 0 or > 2160)
        {
            throw new ArgumentOutOfRangeException(
                nameof(cancellationWindowHours),
                "The cancellation window must be between 0 and 2160 hours.");
        }

        CancellationWindowHours = cancellationWindowHours;
    }

    public void ConfigurePaymentPolicy(bool enabled, decimal? depositPercentage)
    {
        if (depositPercentage is <= 0 or > 100)
        {
            throw new ArgumentOutOfRangeException(
                nameof(depositPercentage),
                "A deposit percentage must be greater than zero and no more than 100.");
        }

        OnlinePaymentsEnabled = enabled;
        DepositPercentage = enabled ? depositPercentage : null;
    }

    public decimal CalculatePaymentAmount(decimal servicePrice)
        => decimal.Round(
            servicePrice * (DepositPercentage ?? 100m) / 100m,
            2,
            MidpointRounding.ToEven);

    private static string NormalizeSlug(string slug)
    {
        var normalized = DomainGuard.NotBlank(slug, nameof(slug), 100).ToLowerInvariant();
        if (normalized.Any(character => !char.IsLetterOrDigit(character) && character != '-'))
        {
            throw new ArgumentException(
                "A tenant slug can contain only lowercase letters, numbers, and hyphens.",
                nameof(slug));
        }

        return normalized;
    }
}
