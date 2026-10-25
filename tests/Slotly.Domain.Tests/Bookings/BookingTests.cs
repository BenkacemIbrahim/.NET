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
