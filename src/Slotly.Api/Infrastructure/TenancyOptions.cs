namespace Slotly.Api.Infrastructure;

public sealed class TenancyOptions
{
    public const string SectionName = "Tenancy";

    public string BaseDomain { get; set; } = "slotly.local";

    public bool EnableSubdomainResolution { get; set; } = true;

    public bool EnableHeaderResolution { get; set; } = true;
}
