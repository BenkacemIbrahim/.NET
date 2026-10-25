using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");
        builder.HasKey(value => value.Id);
        builder.Property(value => value.Action).HasMaxLength(200).IsRequired();
        builder.Property(value => value.Method).HasMaxLength(16).IsRequired();
        builder.Property(value => value.Path).HasMaxLength(1000).IsRequired();
        builder.Property(value => value.CorrelationId).HasMaxLength(128).IsRequired();
        builder.Property(value => value.IpAddress).HasMaxLength(45);
        builder.HasIndex(value => new { value.TenantId, value.OccurredAt });
        builder.HasIndex(value => new { value.UserId, value.OccurredAt });
    }
}
