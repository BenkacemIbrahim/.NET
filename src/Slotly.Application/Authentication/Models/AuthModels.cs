namespace Slotly.Application.Authentication.Models;

public sealed record AccessTokenResult(
    string Token,
    DateTimeOffset ExpiresAt);

public sealed record RefreshTokenResult(
    string RawToken,
    string TokenHash,
    DateTimeOffset ExpiresAt);

public sealed record UserDto(
    Guid Id,
    Guid TenantId,
    string Email,
    string DisplayName,
    string Role,
    bool IsActive);

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset ExpiresAt,
    UserDto User);
