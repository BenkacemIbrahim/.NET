using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Users;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property(user => user.Email).HasMaxLength(320).IsRequired();
        builder.Property(user => user.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(user => user.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(user => user.PasswordHash).HasMaxLength(500).IsRequired();
        builder.Property(user => user.LockoutEnabled).IsRequired().HasDefaultValue(true);
        builder.Property(user => user.AccessFailedCount).IsRequired().HasDefaultValue(0);
        builder.Property(user => user.LockoutEnd);
        builder.HasIndex(user => new { user.TenantId, user.Email }).IsUnique();
        builder.HasIndex(user => new { user.TenantId, user.IsActive });
    }
}

