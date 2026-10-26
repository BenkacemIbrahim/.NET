namespace Slotly.Api.Infrastructure;

public sealed class TenancyOptions
{
    public const string SectionName = "Tenancy";

    public string BaseDomain { get; set; } = string.Empty;

    public bool EnableSubdomainResolution { get; set; }

    public bool EnableHeaderResolution { get; set; }
}
