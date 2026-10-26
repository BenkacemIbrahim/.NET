using FluentAssertions;
using Slotly.Domain.Bookings;
using Slotly.Domain.ValueObjects;

namespace Slotly.Domain.Tests.Bookings;

public sealed class BookingTests
{
    [Fact]
    public void IncludesServiceBufferInBlockedPeriod()
    {
        var start = new DateTimeOffset(2026, 11, 1, 10, 0, 0, TimeSpan.Zero);
        var slot = new TimeSlot(start, start.AddMinutes(30));

        var booking = Booking.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            slot,
            TimeSpan.FromMinutes(15));

        booking.BlockedUntil.Should().Be(slot.EndsAt.AddMinutes(15));
    }

    [Fact]
    public void ConfirmAndCompleteFollowValidLifecycle()
    {
        var booking = CreateBooking();

        booking.Confirm();
        booking.Complete();

        booking.Status.Should().Be(BookingStatus.Completed);
    }

    [Fact]
    public void CompleteRejectsPendingBooking()
    {
        var booking = CreateBooking();

        var act = booking.Complete;

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void CancelRequiresReasonAndMakesBookingTerminal()
    {
        var booking = CreateBooking();

        booking.Cancel("Customer requested a different week.");
        var act = booking.Confirm;

        booking.Status.Should().Be(BookingStatus.Cancelled);
        booking.CancellationReason.Should().Be("Customer requested a different week.");
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void LifecycleChangesRaiseNotificationDomainEvents()
    {
        var booking = CreateBooking();
        var originalStart = booking.Slot.StartsAt;
        var newSlot = new TimeSlot(originalStart.AddDays(1), originalStart.AddDays(1).AddMinutes(30));

        booking.Confirm();
        booking.Reschedule(newSlot);
        booking.Cancel("Schedule changed.");

        booking.DomainEvents.Should().ContainInOrder(
            new BookingCreated(booking.TenantId, booking.Id, originalStart),
            new BookingRescheduled(booking.TenantId, booking.Id, originalStart, newSlot.StartsAt),
            new BookingCancelled(booking.TenantId, booking.Id, newSlot.StartsAt, "Schedule changed."));
    }

    [Fact]
    public void MarkNoShowFollowsValidLifecycleAndRejectsPending()
    {
        var booking = CreateBooking();

        var actPending = booking.MarkNoShow;
        actPending.Should().Throw<InvalidOperationException>();

        booking.Confirm();
        booking.MarkNoShow();

        booking.Status.Should().Be(BookingStatus.NoShow);
    }

    [Fact]
    public void RescheduleUpdatesStaffAndRaisesDomainEvent()
    {
        var booking = CreateBooking();
        booking.Confirm();

        var newStaffId = Guid.NewGuid();
        var newStart = booking.Slot.StartsAt.AddDays(2);
        var newSlot = new TimeSlot(newStart, newStart.AddMinutes(45));

        booking.Reschedule(newStaffId, newSlot, TimeSpan.FromMinutes(10));

        booking.StaffId.Should().Be(newStaffId);
        booking.Slot.StartsAt.Should().Be(newStart);
        booking.BlockedUntil.Should().Be(newSlot.EndsAt.AddMinutes(10));
    }

    [Fact]
    public void RescheduleRejectsCancelledOrCompletedBooking()
    {
        var booking = CreateBooking();
        booking.Cancel("Cancelled by client");

        var newSlot = new TimeSlot(DateTimeOffset.UtcNow.AddDays(1), DateTimeOffset.UtcNow.AddDays(1).AddMinutes(30));
        var act = () => booking.Reschedule(newSlot);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void SetSlotRejectsNegativeOrExcessiveBufferTime()
    {
        var start = DateTimeOffset.UtcNow.AddDays(1);
        var slot = new TimeSlot(start, start.AddMinutes(30));

        var actNegative = () => Booking.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), slot, TimeSpan.FromMinutes(-5));
        var actExcessive = () => Booking.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), slot, TimeSpan.FromDays(2));

        actNegative.Should().Throw<ArgumentOutOfRangeException>();
        actExcessive.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void CancelRejectsBlankReason()
    {
        var booking = CreateBooking();
        var act = () => booking.Cancel("   ");

        act.Should().Throw<ArgumentException>();
    }

    private static Booking CreateBooking()
    {
        var start = new DateTimeOffset(2026, 11, 1, 10, 0, 0, TimeSpan.Zero);
        return Booking.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            new TimeSlot(start, start.AddMinutes(30)));
    }
}
