using Slotly.Domain.Common;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Bookings;

public sealed class Booking : Entity, ITenantOwned
{
    private DateTimeOffset _endsAt;
    private DateTimeOffset _startsAt;
    private DateTimeOffset _blockedUntil;

    private Booking()
    {
    }

    private Booking(
        Guid tenantId,
        Guid customerId,
        Guid serviceId,
        Guid staffId,
        TimeSlot slot,
        TimeSpan bufferTime)
    {
        TenantId = DomainGuard.NotEmpty(tenantId, nameof(tenantId));
        CustomerId = DomainGuard.NotEmpty(customerId, nameof(customerId));
        ServiceId = DomainGuard.NotEmpty(serviceId, nameof(serviceId));
        StaffId = DomainGuard.NotEmpty(staffId, nameof(staffId));
        SetSlot(slot, bufferTime);
        Status = BookingStatus.Pending;
        Version = Guid.NewGuid();
    }

    public Guid TenantId { get; private set; }

    public Guid CustomerId { get; private set; }

    public Guid ServiceId { get; private set; }

    public Guid StaffId { get; private set; }

    public TimeSlot Slot => new(_startsAt, _endsAt);

    public DateTimeOffset BlockedUntil => _blockedUntil;

    public BookingStatus Status { get; private set; }

    public string? CancellationReason { get; private set; }

    public Guid Version { get; private set; }

    public static Booking Create(
        Guid tenantId,
        Guid customerId,
        Guid serviceId,
        Guid staffId,
        TimeSlot slot,
        TimeSpan bufferTime = default)
        => new(tenantId, customerId, serviceId, staffId, slot, bufferTime);

    public void Confirm()
    {
        EnsureStatus(BookingStatus.Pending, "Only pending bookings can be confirmed.");
        Status = BookingStatus.Confirmed;
    }

    public void Cancel(string reason)
    {
        if (Status is not BookingStatus.Pending and not BookingStatus.Confirmed)
        {
            throw new InvalidOperationException("Only pending or confirmed bookings can be cancelled.");
        }

        CancellationReason = DomainGuard.NotBlank(reason, nameof(reason), 500);
        Status = BookingStatus.Cancelled;
    }

    public void Complete()
    {
        EnsureStatus(BookingStatus.Confirmed, "Only confirmed bookings can be completed.");
        Status = BookingStatus.Completed;
    }

    public void MarkNoShow()
    {
        EnsureStatus(BookingStatus.Confirmed, "Only confirmed bookings can be marked as no-show.");
        Status = BookingStatus.NoShow;
    }

    public void Reschedule(TimeSlot slot, TimeSpan bufferTime = default)
    {
        if (Status is not BookingStatus.Pending and not BookingStatus.Confirmed)
        {
            throw new InvalidOperationException("Only active bookings can be rescheduled.");
        }

        SetSlot(slot, bufferTime);
    }

    public void Reschedule(Guid staffId, TimeSlot slot, TimeSpan bufferTime = default)
    {
        Reschedule(slot, bufferTime);
        StaffId = DomainGuard.NotEmpty(staffId, nameof(staffId));
    }

    private void EnsureStatus(BookingStatus expected, string message)
    {
        if (Status != expected)
        {
            throw new InvalidOperationException(message);
        }
    }

    private void SetSlot(TimeSlot slot, TimeSpan bufferTime)
    {
        ArgumentNullException.ThrowIfNull(slot);
        if (bufferTime < TimeSpan.Zero || bufferTime > TimeSpan.FromDays(1))
        {
            throw new ArgumentOutOfRangeException(
                nameof(bufferTime),
                "Buffer time must be between zero and one day.");
        }

        _startsAt = slot.StartsAt;
        _endsAt = slot.EndsAt;
        _blockedUntil = slot.EndsAt.Add(bufferTime);
    }
}
