using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Services;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property(service => service.Name).HasMaxLength(200).IsRequired();
        builder.Property<int>("_durationMinutes").HasColumnName("duration_minutes").IsRequired();
        builder.Property<int>("_bufferMinutes").HasColumnName("buffer_minutes").IsRequired();
        builder.Property<decimal>("_priceAmount").HasColumnName("price_amount").HasPrecision(12, 2).IsRequired();
        builder.Property<string>("_priceCurrency").HasColumnName("price_currency").HasMaxLength(3).IsRequired();
        builder.Ignore(service => service.Duration);
        builder.Ignore(service => service.BufferTime);
        builder.Ignore(service => service.Price);
        builder.HasIndex(service => new { service.TenantId, service.IsActive, service.Name });
    }
}
