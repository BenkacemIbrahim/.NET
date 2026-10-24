using FluentAssertions;
using Slotly.Domain.Users;
using Slotly.Infrastructure.Authentication;

namespace Slotly.Api.IntegrationTests.Unit;

public sealed class PasswordHasherTests
{
    private readonly PasswordHasherService _hasher = new();
    private readonly User _user = User.Create(Guid.NewGuid(), "user@example.com", "Test User", UserRole.Staff, "initial-hash");

    [Fact]
    public void HashPasswordProducesNonEmptySecureHash()
    {
        var hash = _hasher.HashPassword(_user, "P@ssword123!");

        hash.Should().NotBeNullOrWhiteSpace();
        hash.Should().NotBe("P@ssword123!");
    }

    [Fact]
    public void VerifyPasswordSucceedsWithCorrectPassword()
    {
        var hash = _hasher.HashPassword(_user, "P@ssword123!");

        var isValid = _hasher.VerifyPassword(_user, hash, "P@ssword123!");

        isValid.Should().BeTrue();
    }

    [Fact]
    public void VerifyPasswordFailsWithIncorrectPassword()
    {
        var hash = _hasher.HashPassword(_user, "P@ssword123!");

        var isValid = _hasher.VerifyPassword(_user, hash, "WrongPassword456!");

        isValid.Should().BeFalse();
    }
}
