using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Bookings;
using Slotly.Domain.Customers;
using Slotly.Domain.Services;
using Slotly.Domain.Staff;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property<DateTimeOffset>("_startsAt").HasColumnName("starts_at").IsRequired();
        builder.Property<DateTimeOffset>("_endsAt").HasColumnName("ends_at").IsRequired();
        builder.Property(booking => booking.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(booking => booking.CancellationReason).HasMaxLength(500);
        builder.Property(booking => booking.Version).IsConcurrencyToken();
        builder.Ignore(booking => booking.Slot);
        builder.HasIndex("TenantId", "StaffId", "_startsAt", "Status");
        builder.HasIndex(booking => new { booking.TenantId, booking.CustomerId });
        builder.HasOne<Customer>()
            .WithMany()
            .HasForeignKey(booking => new { booking.TenantId, booking.CustomerId })
            .HasPrincipalKey(customer => new { customer.TenantId, customer.Id })
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Service>()
            .WithMany()
            .HasForeignKey(booking => new { booking.TenantId, booking.ServiceId })
            .HasPrincipalKey(service => new { service.TenantId, service.Id })
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Staff>()
            .WithMany()
            .HasForeignKey(booking => new { booking.TenantId, booking.StaffId })
            .HasPrincipalKey(staff => new { staff.TenantId, staff.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
