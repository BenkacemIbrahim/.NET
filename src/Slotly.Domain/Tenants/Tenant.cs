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
        IsActive = true;
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public static Tenant Create(string name, string slug) => new(name, slug);

    public void Rename(string name)
    {
        Name = DomainGuard.NotBlank(name, nameof(name), 200);
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

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
