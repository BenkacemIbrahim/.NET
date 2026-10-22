using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Common;
using Slotly.Domain.Tenants;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal static class EntityConfigurationExtensions
{
    public static void ConfigureEntity<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : Entity
    {
        builder.HasKey(entity => entity.Id);
        builder.Property(entity => entity.CreatedAt).IsRequired();
        builder.Property(entity => entity.UpdatedAt).IsRequired();
    }

    public static void ConfigureTenantOwned<TEntity>(this EntityTypeBuilder<TEntity> builder)
        where TEntity : Entity, ITenantOwned
    {
        builder.ConfigureEntity();
        builder.HasAlternateKey(entity => new { entity.TenantId, entity.Id });
        builder.HasOne<Tenant>()
            .WithMany()
            .HasForeignKey(entity => entity.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
