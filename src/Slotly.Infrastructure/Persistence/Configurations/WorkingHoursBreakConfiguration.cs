using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Staff;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class WorkingHoursBreakConfiguration : IEntityTypeConfiguration<WorkingHoursBreak>
{
    public void Configure(EntityTypeBuilder<WorkingHoursBreak> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property<TimeOnly>("_startsAt").HasColumnName("starts_at").IsRequired();
        builder.Property<TimeOnly>("_endsAt").HasColumnName("ends_at").IsRequired();
        builder.Ignore(workingBreak => workingBreak.Range);
        builder.HasIndex(workingBreak => new
        {
            workingBreak.TenantId,
            workingBreak.WorkingHoursId,
        });
    }
}
