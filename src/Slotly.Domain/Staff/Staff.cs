using Slotly.Domain.Common;

namespace Slotly.Domain.Staff;

public sealed class Staff : Entity, ITenantOwned
{
    private Staff()
    {
    }

    private Staff(Guid tenantId, Guid? userId, string displayName, string email)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        UserId = userId is null ? null : DomainGuard.NotEmpty(userId.Value, nameof(userId));
        DisplayName = DomainGuard.NotBlank(displayName, nameof(displayName), 200);
        Email = DomainGuard.Email(email, nameof(email));
        IsActive = true;
    }

    public Guid TenantId { get; private set; }

    public Guid? UserId { get; private set; }

    public string DisplayName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public static Staff Create(
        Guid tenantId,
        Guid? userId,
        string displayName,
        string email)
        => new(tenantId, userId, displayName, email);

    public void UpdateProfile(string displayName, string email)
    {
        DisplayName = DomainGuard.NotBlank(displayName, nameof(displayName), 200);
        Email = DomainGuard.Email(email, nameof(email));
    }

    public void LinkUser(Guid userId)
    {
        UserId = DomainGuard.NotEmpty(userId, nameof(userId));
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;
}
