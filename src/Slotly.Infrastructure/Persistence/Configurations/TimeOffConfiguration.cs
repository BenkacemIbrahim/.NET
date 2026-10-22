using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Staff;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class TimeOffConfiguration : IEntityTypeConfiguration<TimeOff>
{
    public void Configure(EntityTypeBuilder<TimeOff> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property<DateTimeOffset>("_startsAt").HasColumnName("starts_at").IsRequired();
        builder.Property<DateTimeOffset>("_endsAt").HasColumnName("ends_at").IsRequired();
        builder.Property(timeOff => timeOff.Reason).HasMaxLength(500);
        builder.Ignore(timeOff => timeOff.Slot);
        builder.HasIndex("TenantId", "StaffId", "_startsAt");
        builder.HasOne<Staff>()
            .WithMany()
            .HasForeignKey(timeOff => new { timeOff.TenantId, timeOff.StaffId })
            .HasPrincipalKey(staff => new { staff.TenantId, staff.Id })
            .OnDelete(DeleteBehavior.Cascade);
    }
}
