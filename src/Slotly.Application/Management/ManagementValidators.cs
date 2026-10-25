using FluentValidation;

namespace Slotly.Application.Management;

public sealed class ServiceRequestValidator : AbstractValidator<ServiceRequest>
{
    public ServiceRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().MaximumLength(200);
        RuleFor(request => request.DurationMinutes).InclusiveBetween(1, 1440);
        RuleFor(request => request.PriceAmount).GreaterThanOrEqualTo(0).LessThan(1_000_000_000);
        RuleFor(request => request.Currency).NotEmpty().Length(3).Matches("^[A-Za-z]{3}$");
        RuleFor(request => request.BufferMinutes).InclusiveBetween(0, 1440);
    }
}

public sealed class StaffRequestValidator : AbstractValidator<StaffRequest>
{
    public StaffRequestValidator()
    {
        RuleFor(request => request.DisplayName).NotEmpty().MaximumLength(200);
        RuleFor(request => request.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(request => request.UserId).NotEqual(Guid.Empty).When(request => request.UserId.HasValue);
    }
}

public sealed class WorkingHoursRequestValidator : AbstractValidator<WorkingHoursRequest>
{
    public WorkingHoursRequestValidator()
    {
        RuleFor(request => request.DayOfWeek).IsInEnum();
        RuleFor(request => request.EndsAt)
            .GreaterThan(request => request.StartsAt)
            .WithMessage("Working hours must end after they start.");
        RuleFor(request => request.Breaks).NotNull();
        RuleForEach(request => request.Breaks).ChildRules(workingBreak =>
        {
            workingBreak.RuleFor(value => value.EndsAt)
                .GreaterThan(value => value.StartsAt)
                .WithMessage("A break must end after it starts.");
        });
    }
}

public sealed class TimeOffRequestValidator : AbstractValidator<TimeOffRequest>
{
    public TimeOffRequestValidator()
    {
        RuleFor(request => request.EndsAt)
            .GreaterThan(request => request.StartsAt)
            .WithMessage("Time off must end after it starts.");
        RuleFor(request => request.Reason).MaximumLength(500);
    }
}
