using FluentAssertions;
using Slotly.Application.Bookings;

namespace Slotly.Application.Tests.Validators;

public sealed class BookingValidatorTests
{
    private readonly CreateBookingRequestValidator _createValidator = new();
    private readonly CancelBookingRequestValidator _cancelValidator = new();
    private readonly RescheduleBookingRequestValidator _rescheduleValidator = new();
    private readonly BookingStateRequestValidator _stateValidator = new();

    [Fact]
    public void CreateBookingRequiresServiceAndStaffIds()
    {
        var request = new CreateBookingRequest(
            Guid.Empty,
            Guid.Empty,
            DateTimeOffset.UtcNow,
            null,
            "Customer",
            "customer@example.com",
            "+212600000000");

        var result = _createValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateBookingRequest.ServiceId));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateBookingRequest.StaffId));
    }

    [Fact]
    public void CreateBookingRequiresCustomerNameAndEmailWhenCustomerIdMissing()
    {
        var request = new CreateBookingRequest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow,
            null,
            "",
            "invalid-email",
            "+212600000000");

        var result = _createValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateBookingRequest.CustomerName));
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateBookingRequest.CustomerEmail));
    }

    [Fact]
    public void CreateBookingSucceedsWithValidAnonymousCustomerDetails()
    {
        var request = new CreateBookingRequest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow,
            null,
            "Sara Martin",
            "sara@example.com",
            "+212600000000");

        var result = _createValidator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void CancelBookingRequiresNonEmptyVersionAndReason()
    {
        var invalid = new CancelBookingRequest(Guid.Empty, "");
        var valid = new CancelBookingRequest(Guid.NewGuid(), "Customer could not attend");

        _cancelValidator.Validate(invalid).IsValid.Should().BeFalse();
        _cancelValidator.Validate(valid).IsValid.Should().BeTrue();
    }

    [Fact]
    public void RescheduleBookingRejectsEmptyVersionOrEmptyStaffIdGuid()
    {
        var invalid = new RescheduleBookingRequest(Guid.Empty, DateTimeOffset.UtcNow, Guid.Empty);
        var valid = new RescheduleBookingRequest(Guid.NewGuid(), DateTimeOffset.UtcNow, Guid.NewGuid());

        _rescheduleValidator.Validate(invalid).IsValid.Should().BeFalse();
        _rescheduleValidator.Validate(valid).IsValid.Should().BeTrue();
    }

    [Fact]
    public void BookingStateRequestRequiresVersion()
    {
        _stateValidator.Validate(new BookingStateRequest(Guid.Empty)).IsValid.Should().BeFalse();
        _stateValidator.Validate(new BookingStateRequest(Guid.NewGuid())).IsValid.Should().BeTrue();
    }
}
