using FluentAssertions;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Validators;

namespace Slotly.Application.Tests.Validators;

public sealed class AuthValidatorTests
{
    private readonly RegisterTenantCommandValidator _registerValidator = new();
    private readonly LoginCommandValidator _loginValidator = new();
    private readonly ChangePasswordCommandValidator _changePasswordValidator = new();
    private readonly InviteStaffCommandValidator _inviteStaffValidator = new();

    [Fact]
    public void RegisterTenantCommandValidatorAcceptsValidInput()
    {
        var command = new RegisterTenantCommand(
            "Acme Health",
            "acme-health",
            "owner@acme.com",
            "Acme Owner",
            "StrongPass123!");

        var result = _registerValidator.Validate(command);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("short")]
    [InlineData("alllowercase123!")]
    [InlineData("ALLUPPERCASE123!")]
    [InlineData("NoSpecialChar123")]
    [InlineData("NoNumberHere!")]
    public void RegisterTenantCommandValidatorRejectsWeakPasswords(string weakPassword)
    {
        var command = new RegisterTenantCommand(
            "Acme Health",
            "acme-health",
            "owner@acme.com",
            "Acme Owner",
            weakPassword);

        var result = _registerValidator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Password");
    }

    [Theory]
    [InlineData("invalid slug")]
    [InlineData("INVALID-SLUG")]
    [InlineData("slug_with_underscores")]
    [InlineData("-leading-hyphen")]
    public void RegisterTenantCommandValidatorRejectsInvalidSlugs(string invalidSlug)
    {
        var command = new RegisterTenantCommand(
            "Acme Health",
            invalidSlug,
            "owner@acme.com",
            "Acme Owner",
            "StrongPass123!");

        var result = _registerValidator.Validate(command);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "TenantSlug");
    }

    [Fact]
    public void LoginCommandValidatorValidatesEmailAndPassword()
    {
        var validCommand = new LoginCommand("user@example.com", "Password123!");
        var invalidCommand = new LoginCommand("invalid-email", "");

        _loginValidator.Validate(validCommand).IsValid.Should().BeTrue();
        var invalidResult = _loginValidator.Validate(invalidCommand);
        invalidResult.IsValid.Should().BeFalse();
        invalidResult.Errors.Should().HaveCount(2);
    }

    [Fact]
    public void ChangePasswordCommandValidatorRequiresDifferentNewPassword()
    {
        var samePasswordCommand = new ChangePasswordCommand("StrongPass123!", "StrongPass123!");
        var validCommand = new ChangePasswordCommand("StrongPass123!", "NewStrongPass456!");

        var sameResult = _changePasswordValidator.Validate(samePasswordCommand);
        sameResult.IsValid.Should().BeFalse();
        sameResult.Errors.Should().Contain(e => e.PropertyName == "NewPassword");

        var validResult = _changePasswordValidator.Validate(validCommand);
        validResult.IsValid.Should().BeTrue();
    }

    [Fact]
    public void InviteStaffCommandValidatorEnforcesStrongPasswordAndEmail()
    {
        var command = new InviteStaffCommand("staff@example.com", "Jane Staff", "StrongPass123!");
        _inviteStaffValidator.Validate(command).IsValid.Should().BeTrue();

        var invalidCommand = new InviteStaffCommand("invalid-email", "", "weak");
        var invalidResult = _inviteStaffValidator.Validate(invalidCommand);
        invalidResult.IsValid.Should().BeFalse();
    }
}
