using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Tenants;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ConfigureEntity();
        builder.Property(tenant => tenant.Name).HasMaxLength(200).IsRequired();
        builder.Property(tenant => tenant.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(tenant => tenant.Slug).IsUnique();
        builder.HasIndex(tenant => tenant.IsActive);
    }
}
