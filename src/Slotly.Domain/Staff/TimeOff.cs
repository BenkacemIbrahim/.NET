using Slotly.Domain.Common;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Staff;

public sealed class TimeOff : Entity, ITenantOwned
{
    private DateTimeOffset _endsAt;
    private DateTimeOffset _startsAt;

    private TimeOff()
    {
    }

    private TimeOff(Guid tenantId, Guid staffId, TimeSlot slot, string? reason)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        StaffId = DomainGuard.NotEmpty(staffId, nameof(staffId));
        SetSlot(slot);
        Reason = string.IsNullOrWhiteSpace(reason)
            ? null
            : DomainGuard.NotBlank(reason, nameof(reason), 500);
    }

    public Guid TenantId { get; private set; }

    public Guid StaffId { get; private set; }

    public TimeSlot Slot => new(_startsAt, _endsAt);

    public string? Reason { get; private set; }

    public static TimeOff Create(Guid tenantId, Guid staffId, TimeSlot slot, string? reason)
        => new(tenantId, staffId, slot, reason);

    public void Reschedule(TimeSlot slot) => SetSlot(slot);

    private void SetSlot(TimeSlot slot)
    {
        ArgumentNullException.ThrowIfNull(slot);
        _startsAt = slot.StartsAt;
        _endsAt = slot.EndsAt;
    }
}
