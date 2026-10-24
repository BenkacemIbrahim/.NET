using Slotly.Application.Authentication.Models;
using Slotly.Domain.Users;

namespace Slotly.Application.Common.Interfaces;

public interface ITokenService
{
    AccessTokenResult GenerateAccessToken(User user, string tenantSlug);

    RefreshTokenResult GenerateRefreshToken(string? ipAddress);

    string HashRefreshToken(string rawToken);
}
