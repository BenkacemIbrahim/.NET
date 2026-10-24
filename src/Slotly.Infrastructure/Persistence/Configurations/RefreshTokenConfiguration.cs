using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Users;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property(token => token.UserId).IsRequired();
        builder.Property(token => token.TokenHash).HasMaxLength(128).IsRequired();
        builder.Property(token => token.ExpiresAt).IsRequired();
        builder.Property(token => token.RevokedAt);
        builder.Property(token => token.ReplacedByTokenHash).HasMaxLength(128);
        builder.Property(token => token.CreatedByIp).HasMaxLength(45);
        builder.Property(token => token.RevokedByIp).HasMaxLength(45);
        builder.Property(token => token.RevocationReason).HasMaxLength(200);

        builder.HasIndex(token => new { token.TenantId, token.TokenHash }).IsUnique();
        builder.HasIndex(token => new { token.TenantId, token.UserId });

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(token => new { token.TenantId, token.UserId })
            .HasPrincipalKey(user => new { user.TenantId, user.Id })
            .OnDelete(DeleteBehavior.Cascade);
    }
}
