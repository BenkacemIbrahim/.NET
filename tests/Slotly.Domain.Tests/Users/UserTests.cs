using FluentAssertions;
using Slotly.Domain.Users;

namespace Slotly.Domain.Tests.Users;

public sealed class UserTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    [Fact]
    public void CreateWithValidParametersInitializesCorrectly()
    {
        var user = User.Create(_tenantId, "owner@example.com", "John Doe", UserRole.TenantOwner, "hashed-password-123");

        user.TenantId.Should().Be(_tenantId);
        user.Email.Should().Be("owner@example.com");
        user.DisplayName.Should().Be("John Doe");
        user.Role.Should().Be(UserRole.TenantOwner);
        user.PasswordHash.Should().Be("hashed-password-123");
        user.IsActive.Should().BeTrue();
        user.LockoutEnabled.Should().BeTrue();
        user.AccessFailedCount.Should().Be(0);
        user.LockoutEnd.Should().BeNull();
    }

    [Fact]
    public void RecordFailedLoginReachingThresholdLocksAccount()
    {
        var user = User.Create(_tenantId, "staff@example.com", "Jane Staff", UserRole.Staff, "hash");
        var now = DateTimeOffset.UtcNow;

        user.RecordFailedLogin(now, maxFailedAttempts: 3, TimeSpan.FromMinutes(15));
        user.AccessFailedCount.Should().Be(1);
        user.IsLockedOut(now).Should().BeFalse();

        user.RecordFailedLogin(now, maxFailedAttempts: 3, TimeSpan.FromMinutes(15));
        user.AccessFailedCount.Should().Be(2);
        user.IsLockedOut(now).Should().BeFalse();

        user.RecordFailedLogin(now, maxFailedAttempts: 3, TimeSpan.FromMinutes(15));
        user.AccessFailedCount.Should().Be(3);
        user.IsLockedOut(now).Should().BeTrue();
        user.LockoutEnd.Should().Be(now.AddMinutes(15));
        user.IsLockedOut(now.AddMinutes(16)).Should().BeFalse();
    }

    [Fact]
    public void RecordSuccessfulLoginResetsLockoutAndFailedCount()
    {
        var user = User.Create(_tenantId, "staff@example.com", "Jane Staff", UserRole.Staff, "hash");
        var now = DateTimeOffset.UtcNow;

        user.RecordFailedLogin(now, maxFailedAttempts: 2, TimeSpan.FromMinutes(15));
        user.RecordFailedLogin(now, maxFailedAttempts: 2, TimeSpan.FromMinutes(15));
        user.IsLockedOut(now).Should().BeTrue();

        user.RecordSuccessfulLogin();

        user.AccessFailedCount.Should().Be(0);
        user.LockoutEnd.Should().BeNull();
        user.IsLockedOut(now).Should().BeFalse();
    }

    [Fact]
    public void UpdateProfileAndChangeRoleUpdatesState()
    {
        var user = User.Create(_tenantId, "user@example.com", "Old Name", UserRole.Customer, "hash");

        user.UpdateProfile("New Name", "new@example.com");
        user.ChangeRole(UserRole.Staff);
        user.SetPasswordHash("new-hash");

        user.DisplayName.Should().Be("New Name");
        user.Email.Should().Be("new@example.com");
        user.Role.Should().Be(UserRole.Staff);
        user.PasswordHash.Should().Be("new-hash");
    }

    [Fact]
    public void ActivateAndDeactivateTogglesActiveState()
    {
        var user = User.Create(_tenantId, "user@example.com", "Name", UserRole.Customer, "hash");

        user.Deactivate();
        user.IsActive.Should().BeFalse();

        user.Activate();
        user.IsActive.Should().BeTrue();
    }
}
