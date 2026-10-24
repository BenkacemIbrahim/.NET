using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Slotly.Application.Authentication.Models;
using Slotly.Application.Common.Interfaces;
using Slotly.Domain.Users;

namespace Slotly.Infrastructure.Authentication;

public sealed class JwtTokenService(
    IOptions<JwtOptions> jwtOptions,
    TimeProvider timeProvider)
    : ITokenService
{
    private readonly JwtOptions _options = jwtOptions.Value;

    public AccessTokenResult GenerateAccessToken(User user, string tenantSlug)
    {
        var now = timeProvider.GetUtcNow();
        var expiresAt = now.Add(TimeSpan.FromMinutes(_options.AccessTokenLifetimeMinutes));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("tenant_id", user.TenantId.ToString()),
            new("tenant_slug", tenantSlug),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            NotBefore = now.UtcDateTime,
            Expires = expiresAt.UtcDateTime,
            SigningCredentials = credentials,
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(securityToken);

        return new AccessTokenResult(tokenString, expiresAt);
    }

    public RefreshTokenResult GenerateRefreshToken(string? ipAddress)
    {
        var now = timeProvider.GetUtcNow();
        var expiresAt = now.Add(TimeSpan.FromDays(_options.RefreshTokenLifetimeDays));

        var randomBytes = RandomNumberGenerator.GetBytes(64);
        var rawToken = Convert.ToBase64String(randomBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var tokenHash = HashRefreshToken(rawToken);

        return new RefreshTokenResult(rawToken, tokenHash, expiresAt);
    }

    public string HashRefreshToken(string rawToken)
    {
        var bytes = Encoding.UTF8.GetBytes(rawToken);
        var hashBytes = SHA256.HashData(bytes);
        return Convert.ToHexStringLower(hashBytes);
    }
}
