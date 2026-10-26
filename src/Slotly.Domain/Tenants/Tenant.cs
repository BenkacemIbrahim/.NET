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
        PrimaryColor = "#5145CD";
        CancellationWindowHours = 24;
        IsActive = true;
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public string TimeZoneId { get; private set; } = string.Empty;

    public string PrimaryColor { get; private set; } = string.Empty;

    public string? LogoUrl { get; private set; }

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

    public void ConfigureBranding(string primaryColor, string? logoUrl)
    {
        var normalizedColor = DomainGuard.NotBlank(primaryColor, nameof(primaryColor), 7).ToUpperInvariant();
        if (normalizedColor.Length != 7
            || normalizedColor[0] != '#'
            || normalizedColor[1..].Any(character => !Uri.IsHexDigit(character)))
        {
            throw new ArgumentException("The primary color must be a six-digit hexadecimal color.", nameof(primaryColor));
        }

        var normalizedLogoUrl = string.IsNullOrWhiteSpace(logoUrl) ? null : logoUrl.Trim();
        if (normalizedLogoUrl is not null
            && (!Uri.TryCreate(normalizedLogoUrl, UriKind.Absolute, out var uri)
                || uri.Scheme is not ("http" or "https")))
        {
            throw new ArgumentException("The logo URL must be an absolute HTTP or HTTPS URL.", nameof(logoUrl));
        }

        PrimaryColor = normalizedColor;
        LogoUrl = normalizedLogoUrl;
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
