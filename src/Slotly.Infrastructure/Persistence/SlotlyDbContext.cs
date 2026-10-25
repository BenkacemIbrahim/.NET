using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Slotly.Application.Common.Interfaces;
using Slotly.Domain.Bookings;
using Slotly.Domain.Common;
using Slotly.Domain.Customers;
using Slotly.Domain.Payments;
using Slotly.Domain.Services;
using Slotly.Domain.Staff;
using Slotly.Domain.Tenants;
using Slotly.Domain.Users;

namespace Slotly.Infrastructure.Persistence;

public sealed class SlotlyDbContext(
    DbContextOptions<SlotlyDbContext> options,
    ITenantContext tenantContext,
    TimeProvider timeProvider,
    ICorrelationContext correlationContext)
    : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<User> Users => Set<User>();

    public DbSet<Service> Services => Set<Service>();

    public DbSet<Staff> Staff => Set<Staff>();

    public DbSet<WorkingHours> WorkingHours => Set<WorkingHours>();

    public DbSet<WorkingHoursBreak> WorkingHoursBreaks => Set<WorkingHoursBreak>();

    public DbSet<TimeOff> TimeOff => Set<TimeOff>();

    public DbSet<Customer> Customers => Set<Customer>();

    public DbSet<Booking> Bookings => Set<Booking>();

    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SlotlyDbContext).Assembly);

        modelBuilder.Entity<User>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<RefreshToken>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<Service>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);

        modelBuilder.Entity<Staff>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<WorkingHours>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<WorkingHoursBreak>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<TimeOff>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<Customer>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<Booking>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
        modelBuilder.Entity<Payment>().HasQueryFilter(entity =>
            tenantContext.TenantId.HasValue && entity.TenantId == tenantContext.TenantId.Value);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        PrepareTrackedEntities();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        PrepareTrackedEntities();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void PrepareTrackedEntities()
    {
        var now = timeProvider.GetUtcNow();

        CaptureDomainEvents(now);

        foreach (var entry in ChangeTracker.Entries<Entity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property(entity => entity.CreatedAt).CurrentValue = now;
                entry.Property(entity => entity.UpdatedAt).CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(entity => entity.CreatedAt).IsModified = false;
                entry.Property(entity => entity.UpdatedAt).CurrentValue = now;
            }
        }

        foreach (var entry in ChangeTracker.Entries<ITenantOwned>()
                     .Where(entry => entry.State is EntityState.Added
                         or EntityState.Modified
                         or EntityState.Deleted))
        {
            var activeTenantId = tenantContext.TenantId
                ?? throw new InvalidOperationException(
                    "A tenant context is required for tenant-owned writes.");
            var tenantProperty = entry.Property(entity => entity.TenantId);

            if (entry.State == EntityState.Added)
            {
                tenantProperty.CurrentValue = activeTenantId;
                continue;
            }

            if (tenantProperty.OriginalValue != activeTenantId
                || tenantProperty.CurrentValue != activeTenantId
                || tenantProperty.IsModified)
            {
                throw new InvalidOperationException(
                    "Cross-tenant writes are not permitted.");
            }
        }

        foreach (var entry in ChangeTracker.Entries<Booking>()
                     .Where(entry => entry.State == EntityState.Modified))
        {
            entry.Property(booking => booking.Version).CurrentValue = Guid.NewGuid();
        }
    }

    private void CaptureDomainEvents(DateTimeOffset occurredAt)
    {
        var entities = ChangeTracker.Entries<Entity>()
            .Select(entry => entry.Entity)
            .Where(entity => entity.DomainEvents.Count > 0)
            .ToArray();

        foreach (var entity in entities)
        {
            foreach (var domainEvent in entity.DomainEvents)
            {
                OutboxMessages.Add(OutboxMessage.Create(
                    domainEvent,
                    JsonSerializer.Serialize(domainEvent, domainEvent.GetType()),
                    correlationContext.CorrelationId ?? Guid.NewGuid().ToString("N"),
                    occurredAt));
            }

            entity.ClearDomainEvents();
        }
    }
}
