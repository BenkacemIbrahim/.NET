using System.IdentityModel.Tokens.Jwt;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Slotly.Domain.Users;
using Slotly.Infrastructure.Authentication;

namespace Slotly.Api.IntegrationTests.Unit;

public sealed class TokenServiceTests
{
    private readonly JwtOptions _options = new()
    {
        SigningKey = "test-signing-key-must-be-at-least-32-chars-long-for-hmac-sha256!",
        Issuer = "test-issuer",
        Audience = "test-audience",
        AccessTokenLifetimeMinutes = 15,
        RefreshTokenLifetimeDays = 7,
    };

    private readonly JwtTokenService _tokenService;

    public TokenServiceTests()
    {
        _tokenService = new JwtTokenService(Options.Create(_options), TimeProvider.System);
    }

    [Fact]
    public void GenerateAccessTokenCreatesValidJwtWithClaims()
    {
        var tenantId = Guid.NewGuid();
        var user = User.Create(tenantId, "test@example.com", "Test User", UserRole.TenantOwner, "hash");

        var result = _tokenService.GenerateAccessToken(user, "test-tenant");

        result.Token.Should().NotBeNullOrWhiteSpace();
        result.ExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(result.Token);

        jwt.Issuer.Should().Be("test-issuer");
        jwt.Audiences.Should().Contain("test-audience");
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "test@example.com");
        jwt.Claims.Should().Contain(c => c.Type == "tenant_id" && c.Value == tenantId.ToString());
        jwt.Claims.Should().Contain(c => c.Type == "tenant_slug" && c.Value == "test-tenant");
        jwt.Claims.Should().Contain(c => c.Type == "role" && c.Value == UserRole.TenantOwner.ToString());
    }

    [Fact]
    public void GenerateRefreshTokenCreatesRandomTokenAndConsistentHash()
    {
        var result1 = _tokenService.GenerateRefreshToken("127.0.0.1");
        var result2 = _tokenService.GenerateRefreshToken("127.0.0.1");

        result1.RawToken.Should().NotBeNullOrWhiteSpace();
        result1.TokenHash.Should().NotBeNullOrWhiteSpace();
        result1.RawToken.Should().NotBe(result2.RawToken);

        var computedHash = _tokenService.HashRefreshToken(result1.RawToken);
        computedHash.Should().Be(result1.TokenHash);
    }

    [Fact]
    public void HashRefreshTokenIsDeterministic()
    {
        const string rawToken = "my-secure-sample-refresh-token-string";
        var hash1 = _tokenService.HashRefreshToken(rawToken);
        var hash2 = _tokenService.HashRefreshToken(rawToken);

        hash1.Should().Be(hash2);
        hash1.Should().HaveLength(64);
    }
}
