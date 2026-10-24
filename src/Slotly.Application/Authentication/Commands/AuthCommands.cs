namespace Slotly.Application.Authentication.Commands;

public sealed record RegisterTenantCommand(
    string TenantName,
    string TenantSlug,
    string OwnerEmail,
    string OwnerDisplayName,
    string Password);

public sealed record LoginCommand(
    string Email,
    string Password,
    string? TenantSlug = null,
    Guid? TenantId = null);

public sealed record RefreshTokenCommand(
    string RefreshToken);

public sealed record ChangePasswordCommand(
    string CurrentPassword,
    string NewPassword);

public sealed record InviteStaffCommand(
    string Email,
    string DisplayName,
    string Password);
