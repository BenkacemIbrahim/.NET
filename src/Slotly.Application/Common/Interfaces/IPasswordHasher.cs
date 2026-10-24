using Slotly.Domain.Users;

namespace Slotly.Application.Common.Interfaces;

public interface IPasswordHasher
{
    string HashPassword(User user, string password);

    bool VerifyPassword(User user, string hashedPassword, string providedPassword);
}
