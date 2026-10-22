using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Slotly.Domain.Bookings;
using Slotly.Domain.Payments;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ConfigureTenantOwned();
        builder.Property<decimal>("_amount").HasColumnName("amount").HasPrecision(12, 2).IsRequired();
        builder.Property<string>("_currency").HasColumnName("currency").HasMaxLength(3).IsRequired();
        builder.Property(payment => payment.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(payment => payment.ProviderReference).HasMaxLength(200);
        builder.Ignore(payment => payment.Amount);
        builder.HasIndex(payment => new { payment.TenantId, payment.BookingId, payment.Status });
        builder.HasIndex(payment => new { payment.TenantId, payment.ProviderReference })
            .IsUnique()
            .HasFilter("provider_reference IS NOT NULL");
        builder.HasOne<Booking>()
            .WithMany()
            .HasForeignKey(payment => new { payment.TenantId, payment.BookingId })
            .HasPrincipalKey(booking => new { booking.TenantId, booking.Id })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
