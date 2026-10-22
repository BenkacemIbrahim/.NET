using Slotly.Domain.Common;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Staff;

public sealed class WorkingHours : Entity, ITenantOwned
{
    private readonly List<WorkingHoursBreak> _breaks = [];
    private TimeOnly _endsAt;
    private TimeOnly _startsAt;

    private WorkingHours()
    {
    }

    private WorkingHours(
        Guid tenantId,
        Guid staffId,
        DayOfWeek dayOfWeek,
        DailyTimeRange range)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        StaffId = DomainGuard.NotEmpty(staffId, nameof(staffId));
        DayOfWeek = dayOfWeek;
        SetRange(range);
    }

    public Guid TenantId { get; private set; }

    public Guid StaffId { get; private set; }

    public DayOfWeek DayOfWeek { get; private set; }

    public DailyTimeRange Range => new(_startsAt, _endsAt);

    public IReadOnlyCollection<WorkingHoursBreak> Breaks => _breaks.AsReadOnly();

    public static WorkingHours Create(
        Guid tenantId,
        Guid staffId,
        DayOfWeek dayOfWeek,
        DailyTimeRange range)
        => new(tenantId, staffId, dayOfWeek, range);

    public WorkingHoursBreak AddBreak(DailyTimeRange range)
    {
        ArgumentNullException.ThrowIfNull(range);
        if (!Range.Contains(range))
        {
            throw new InvalidOperationException("A break must fall within working hours.");
        }

        if (_breaks.Any(existing => existing.Range.Overlaps(range)))
        {
            throw new InvalidOperationException("Working-hour breaks cannot overlap.");
        }

        var workingBreak = new WorkingHoursBreak(TenantId, Id, range);
        _breaks.Add(workingBreak);
        return workingBreak;
    }

    public void ChangeRange(DailyTimeRange range)
    {
        ArgumentNullException.ThrowIfNull(range);
        if (_breaks.Any(existing => !range.Contains(existing.Range)))
        {
            throw new InvalidOperationException("The new working range must contain every break.");
        }

        SetRange(range);
    }

    public void RemoveBreak(Guid breakId)
    {
        var existing = _breaks.SingleOrDefault(workingBreak => workingBreak.Id == breakId)
            ?? throw new InvalidOperationException("The requested break does not exist.");
        _breaks.Remove(existing);
    }

    private void SetRange(DailyTimeRange range)
    {
        ArgumentNullException.ThrowIfNull(range);
        _startsAt = range.StartsAt;
        _endsAt = range.EndsAt;
    }
}
