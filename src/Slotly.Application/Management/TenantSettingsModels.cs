namespace Slotly.Application.Management;

public sealed record TenantSettingsRequest(
    string Name,
    string TimeZoneId,
    int CancellationWindowHours,
    string PrimaryColor,
    string? LogoUrl);

public sealed record TenantSettingsDto(
    Guid Id,
    string Name,
    string Slug,
    string TimeZoneId,
    int CancellationWindowHours,
    string PrimaryColor,
    string? LogoUrl,
    bool OnlinePaymentsEnabled,
    decimal? DepositPercentage);
