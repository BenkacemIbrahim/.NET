using Slotly.Domain.Common;

namespace Slotly.Domain.Users;

public sealed class User : Entity, ITenantOwned
{
    private User()
    {
    }

    private User(Guid tenantId, string email, string displayName, UserRole role, string passwordHash)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        Email = DomainGuard.Email(email, nameof(email));
        DisplayName = DomainGuard.NotBlank(displayName, nameof(displayName), 200);
        Role = role;
        PasswordHash = DomainGuard.NotBlank(passwordHash, nameof(passwordHash), 500);
        IsActive = true;
        LockoutEnabled = true;
        AccessFailedCount = 0;
    }

    public Guid TenantId { get; private set; }

    public string Email { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public UserRole Role { get; private set; }

    public string PasswordHash { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public bool LockoutEnabled { get; private set; }

    public int AccessFailedCount { get; private set; }

    public DateTimeOffset? LockoutEnd { get; private set; }

    public static User Create(
        Guid tenantId,
        string email,
        string displayName,
        UserRole role,
        string passwordHash)
        => new(tenantId, email, displayName, role, passwordHash);

    public void UpdateProfile(string displayName, string email)
    {
        DisplayName = DomainGuard.NotBlank(displayName, nameof(displayName), 200);
        Email = DomainGuard.Email(email, nameof(email));
    }

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = DomainGuard.NotBlank(passwordHash, nameof(passwordHash), 500);
    }

    public void ChangeRole(UserRole role) => Role = role;

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public bool IsLockedOut(DateTimeOffset now)
        => LockoutEnabled && LockoutEnd.HasValue && LockoutEnd.Value > now;

    public void RecordSuccessfulLogin()
    {
        AccessFailedCount = 0;
        LockoutEnd = null;
    }

    public void RecordFailedLogin(DateTimeOffset now, int maxFailedAttempts, TimeSpan lockoutDuration)
    {
        if (!LockoutEnabled)
        {
            return;
        }

        AccessFailedCount++;
        if (AccessFailedCount >= maxFailedAttempts)
        {
            LockoutEnd = now.Add(lockoutDuration);
        }
    }

    public void ResetLockout()
    {
        AccessFailedCount = 0;
        LockoutEnd = null;
    }

    public void DisableLockout() => LockoutEnabled = false;

    public void EnableLockout() => LockoutEnabled = true;
}

