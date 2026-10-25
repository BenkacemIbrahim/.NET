using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class NotificationDeliveryConfiguration : IEntityTypeConfiguration<NotificationDelivery>
{
    public void Configure(EntityTypeBuilder<NotificationDelivery> builder)
    {
        builder.ToTable("notification_deliveries");
        builder.HasKey(delivery => delivery.Id);
        builder.Property(delivery => delivery.IdempotencyKey).HasMaxLength(300).IsRequired();
        builder.Property(delivery => delivery.Recipient).HasMaxLength(320).IsRequired();
        builder.Property(delivery => delivery.Subject).HasMaxLength(300).IsRequired();
        builder.HasIndex(delivery => delivery.IdempotencyKey).IsUnique();
        builder.HasIndex(delivery => new { delivery.BookingId, delivery.SentAt });
    }
}
