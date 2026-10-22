using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Staff;
using Slotly.Domain.Users;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property(staff => staff.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(staff => staff.Email).HasMaxLength(320).IsRequired();
        builder.HasIndex(staff => new { staff.TenantId, staff.Email }).IsUnique();
        builder.HasIndex(staff => new { staff.TenantId, staff.IsActive });
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(staff => new { staff.TenantId, staff.UserId })
            .HasPrincipalKey(user => new { user.TenantId, user.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
