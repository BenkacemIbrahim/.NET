using FluentAssertions;
using Slotly.Domain.Users;

namespace Slotly.Domain.Tests.Users;

public sealed class RefreshTokenTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _userId = Guid.NewGuid();

    [Fact]
    public void CreateWithValidParametersInitializesCorrectly()
    {
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddDays(7);
        var token = RefreshToken.Create(_tenantId, _userId, "sample-token-hash", expiresAt, "127.0.0.1");

        token.TenantId.Should().Be(_tenantId);
        token.UserId.Should().Be(_userId);
        token.TokenHash.Should().Be("sample-token-hash");
        token.ExpiresAt.Should().Be(expiresAt);
        token.CreatedByIp.Should().Be("127.0.0.1");
        token.IsRevoked.Should().BeFalse();
        token.IsActive(now).Should().BeTrue();
    }

    [Fact]
    public void IsExpiredReturnsTrueWhenNowIsAfterExpiry()
    {
        var now = DateTimeOffset.UtcNow;
        var token = RefreshToken.Create(_tenantId, _userId, "hash", now.AddMinutes(5), null);

        token.IsExpired(now.AddMinutes(4)).Should().BeFalse();
        token.IsExpired(now.AddMinutes(5)).Should().BeTrue();
        token.IsExpired(now.AddMinutes(10)).Should().BeTrue();
    }

    [Fact]
    public void RevokeMarksTokenRevokedWithDetails()
    {
        var now = DateTimeOffset.UtcNow;
        var token = RefreshToken.Create(_tenantId, _userId, "hash", now.AddDays(7), "127.0.0.1");

        token.Revoke(now, "192.168.1.1", "Rotated", "new-hash");

        token.IsRevoked.Should().BeTrue();
        token.IsActive(now).Should().BeFalse();
        token.RevokedAt.Should().Be(now);
        token.RevokedByIp.Should().Be("192.168.1.1");
        token.RevocationReason.Should().Be("Rotated");
        token.ReplacedByTokenHash.Should().Be("new-hash");
    }
}
