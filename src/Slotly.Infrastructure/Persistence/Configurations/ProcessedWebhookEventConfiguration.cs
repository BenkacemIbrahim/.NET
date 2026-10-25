using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Slotly.Infrastructure.Persistence.Configurations;

internal sealed class ProcessedWebhookEventConfiguration : IEntityTypeConfiguration<ProcessedWebhookEvent>
{
    public void Configure(EntityTypeBuilder<ProcessedWebhookEvent> builder)
    {
        builder.ToTable("processed_webhook_events");
        builder.HasKey(value => value.EventId);
        builder.Property(value => value.EventId).HasMaxLength(200);
        builder.Property(value => value.EventType).HasMaxLength(100).IsRequired();
    }
}
