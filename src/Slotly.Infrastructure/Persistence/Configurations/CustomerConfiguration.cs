using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Customers;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property(customer => customer.Name).HasMaxLength(200).IsRequired();
        builder.Property(customer => customer.Email).HasMaxLength(320).IsRequired();
        builder.Property(customer => customer.Phone).HasMaxLength(32);
        builder.HasIndex(customer => new { customer.TenantId, customer.Email }).IsUnique();
        builder.HasIndex(customer => new { customer.TenantId, customer.Name });
    }
}
