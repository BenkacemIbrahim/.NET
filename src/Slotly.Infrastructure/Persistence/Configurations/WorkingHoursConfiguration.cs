using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Staff;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class WorkingHoursConfiguration : IEntityTypeConfiguration<WorkingHours>
{
    public void Configure(EntityTypeBuilder<WorkingHours> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property(hours => hours.DayOfWeek).HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property<TimeOnly>("_startsAt").HasColumnName("starts_at").IsRequired();
        builder.Property<TimeOnly>("_endsAt").HasColumnName("ends_at").IsRequired();
        builder.Ignore(hours => hours.Range);
        builder.HasIndex(hours => new { hours.TenantId, hours.StaffId, hours.DayOfWeek }).IsUnique();
        builder.HasOne<Staff>()
            .WithMany()
            .HasForeignKey(hours => new { hours.TenantId, hours.StaffId })
            .HasPrincipalKey(staff => new { staff.TenantId, staff.Id })
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(hours => hours.Breaks)
            .WithOne()
            .HasForeignKey(workingBreak => new { workingBreak.TenantId, workingBreak.WorkingHoursId })
            .HasPrincipalKey(hours => new { hours.TenantId, hours.Id })
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(hours => hours.Breaks).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
