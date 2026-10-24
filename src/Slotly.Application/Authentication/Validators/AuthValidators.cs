using System.Text.RegularExpressions;
using FluentValidation;
using Slotly.Application.Authentication.Commands;

namespace Slotly.Application.Authentication.Validators;

public static class PasswordValidationExtensions
{
    private static readonly Regex HasUppercase = new(@"[A-Z]", RegexOptions.Compiled);
    private static readonly Regex HasLowercase = new(@"[a-z]", RegexOptions.Compiled);
    private static readonly Regex HasDigit = new(@"[0-9]", RegexOptions.Compiled);
    private static readonly Regex HasSpecial = new(@"[^a-zA-Z0-9]", RegexOptions.Compiled);

    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> ruleBuilder)
    {
        return ruleBuilder
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long.")
            .MaximumLength(128).WithMessage("Password must not exceed 128 characters.")
            .Must(password => HasUppercase.IsMatch(password))
            .WithMessage("Password must contain at least one uppercase letter.")
            .Must(password => HasLowercase.IsMatch(password))
            .WithMessage("Password must contain at least one lowercase letter.")
            .Must(password => HasDigit.IsMatch(password))
            .WithMessage("Password must contain at least one digit.")
            .Must(password => HasSpecial.IsMatch(password))
            .WithMessage("Password must contain at least one special character.");
    }
}

public sealed class RegisterTenantCommandValidator : AbstractValidator<RegisterTenantCommand>
{
    private static readonly Regex SlugPattern = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public RegisterTenantCommandValidator()
    {
        RuleFor(x => x.TenantName)
            .NotEmpty().WithMessage("Tenant name is required.")
            .MaximumLength(200).WithMessage("Tenant name must not exceed 200 characters.");

        RuleFor(x => x.TenantSlug)
            .NotEmpty().WithMessage("Tenant slug is required.")
            .MaximumLength(100).WithMessage("Tenant slug must not exceed 100 characters.")
            .Must(slug => !string.IsNullOrWhiteSpace(slug) && SlugPattern.IsMatch(slug))
            .WithMessage("Tenant slug must contain only lowercase alphanumeric characters and hyphens.");

        RuleFor(x => x.OwnerEmail)
            .NotEmpty().WithMessage("Owner email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(320).WithMessage("Email must not exceed 320 characters.");

        RuleFor(x => x.OwnerDisplayName)
            .NotEmpty().WithMessage("Owner display name is required.")
            .MaximumLength(200).WithMessage("Display name must not exceed 200 characters.");

        RuleFor(x => x.Password)
            .StrongPassword();
    }
}

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}

public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(x => x.NewPassword)
            .StrongPassword()
            .Must((cmd, newPassword) => newPassword != cmd.CurrentPassword)
            .WithMessage("New password must be different from current password.");
    }
}

public sealed class InviteStaffCommandValidator : AbstractValidator<InviteStaffCommand>
{
    public InviteStaffCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(320).WithMessage("Email must not exceed 320 characters.");

        RuleFor(x => x.DisplayName)
            .NotEmpty().WithMessage("Display name is required.")
            .MaximumLength(200).WithMessage("Display name must not exceed 200 characters.");

        RuleFor(x => x.Password)
            .StrongPassword();
    }
}
