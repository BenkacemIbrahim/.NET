using FluentValidation;

namespace Slotly.Application.Bookings;

public sealed class CreateBookingRequestValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingRequestValidator()
    {
        RuleFor(request => request.ServiceId).NotEmpty();
        RuleFor(request => request.StaffId).NotEmpty();
        RuleFor(request => request.CustomerId).NotEqual(Guid.Empty).When(request => request.CustomerId.HasValue);
        RuleFor(request => request.CustomerName)
            .NotEmpty().MaximumLength(200)
            .When(request => !request.CustomerId.HasValue);
        RuleFor(request => request.CustomerEmail)
            .NotEmpty().EmailAddress().MaximumLength(320)
            .When(request => !request.CustomerId.HasValue);
        RuleFor(request => request.CustomerPhone).MaximumLength(32);
    }
}

public sealed class CancelBookingRequestValidator : AbstractValidator<CancelBookingRequest>
{
    public CancelBookingRequestValidator()
    {
        RuleFor(request => request.Version).NotEmpty();
        RuleFor(request => request.Reason).NotEmpty().MaximumLength(500);
    }
}

public sealed class RescheduleBookingRequestValidator : AbstractValidator<RescheduleBookingRequest>
{
    public RescheduleBookingRequestValidator()
    {
        RuleFor(request => request.Version).NotEmpty();
        RuleFor(request => request.StaffId).NotEqual(Guid.Empty).When(request => request.StaffId.HasValue);
    }
}

public sealed class BookingStateRequestValidator : AbstractValidator<BookingStateRequest>
{
    public BookingStateRequestValidator()
    {
        RuleFor(request => request.Version).NotEmpty();
    }
}
