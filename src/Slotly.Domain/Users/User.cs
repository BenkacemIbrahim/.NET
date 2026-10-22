using Slotly.Domain.Common;

namespace Slotly.Domain.Users;

public sealed class User : Entity, ITenantOwned
{
    private User()
    {
    }

    private User(Guid tenantId, string email, string displayName, UserRole role)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        Email = DomainGuard.Email(email, nameof(email));
        DisplayName = DomainGuard.NotBlank(displayName, nameof(displayName), 200);
        Role = role;
        IsActive = true;
    }

    public Guid TenantId { get; private set; }

    public string Email { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public UserRole Role { get; private set; }

    public bool IsActive { get; private set; }

    public static User Create(Guid tenantId, string email, string displayName, UserRole role)
        => new(tenantId, email, displayName, role);

    public void UpdateProfile(string displayName, string email)
    {
        DisplayName = DomainGuard.NotBlank(displayName, nameof(displayName), 200);
        Email = DomainGuard.Email(email, nameof(email));
    }

    public void ChangeRole(UserRole role) => Role = role;

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;
}
