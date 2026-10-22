using Slotly.Domain.Common;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Staff;

public sealed class WorkingHoursBreak : Entity, ITenantOwned
{
    private TimeOnly _endsAt;
    private TimeOnly _startsAt;

    private WorkingHoursBreak()
    {
    }

    internal WorkingHoursBreak(Guid tenantId, Guid workingHoursId, DailyTimeRange range)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        WorkingHoursId = DomainGuard.NotEmpty(workingHoursId, nameof(workingHoursId));
        ArgumentNullException.ThrowIfNull(range);
        _startsAt = range.StartsAt;
        _endsAt = range.EndsAt;
    }

    public Guid TenantId { get; private set; }

    public Guid WorkingHoursId { get; private set; }

    public DailyTimeRange Range => new(_startsAt, _endsAt);
}
