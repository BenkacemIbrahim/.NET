using Slotly.Domain.Common;

namespace Slotly.Domain.Customers;

public sealed class Customer : Entity, ITenantOwned
{
    private Customer()
    {
    }

    private Customer(Guid tenantId, string name, string email, string? phone)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        Name = DomainGuard.NotBlank(name, nameof(name), 200);
        Email = DomainGuard.Email(email, nameof(email));
        Phone = NormalizePhone(phone);
    }

    public Guid TenantId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string? Phone { get; private set; }

    public static Customer Create(Guid tenantId, string name, string email, string? phone)
        => new(tenantId, name, email, phone);

    public void UpdateContactDetails(string name, string email, string? phone)
    {
        Name = DomainGuard.NotBlank(name, nameof(name), 200);
        Email = DomainGuard.Email(email, nameof(email));
        Phone = NormalizePhone(phone);
    }

    private static string? NormalizePhone(string? phone)
    {
        return string.IsNullOrWhiteSpace(phone)
            ? null
            : DomainGuard.NotBlank(phone, nameof(phone), 32);
    }
}
