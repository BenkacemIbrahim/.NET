namespace Slotly.Application.Management;

public sealed record ServiceRequest(
    string Name,
    int DurationMinutes,
    decimal PriceAmount,
    string Currency,
    int BufferMinutes);

public sealed record ServiceDto(
    Guid Id,
    string Name,
    int DurationMinutes,
    decimal PriceAmount,
    string Currency,
    int BufferMinutes,
    bool IsActive);

public sealed record StaffRequest(
    string DisplayName,
    string Email,
    Guid? UserId);

public sealed record StaffDto(
    Guid Id,
    Guid? UserId,
    string DisplayName,
    string Email,
    bool IsActive);

public sealed record WorkingHoursBreakRequest(TimeOnly StartsAt, TimeOnly EndsAt);

public sealed record WorkingHoursRequest(
    DayOfWeek DayOfWeek,
    TimeOnly StartsAt,
    TimeOnly EndsAt,
    IReadOnlyCollection<WorkingHoursBreakRequest> Breaks);

public sealed record WorkingHoursDto(
    Guid Id,
    Guid StaffId,
    DayOfWeek DayOfWeek,
    TimeOnly StartsAt,
    TimeOnly EndsAt,
    IReadOnlyCollection<WorkingHoursBreakRequest> Breaks);

public sealed record TimeOffRequest(
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Reason);

public sealed record TimeOffDto(
    Guid Id,
    Guid StaffId,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? Reason);
