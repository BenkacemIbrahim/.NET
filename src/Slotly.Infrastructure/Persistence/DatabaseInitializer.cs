using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Slotly.Domain.Bookings;
using Slotly.Domain.Customers;
using Slotly.Domain.Services;
using Slotly.Domain.Staff;
using Slotly.Domain.Tenants;
using Slotly.Domain.Users;
using Slotly.Domain.ValueObjects;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeDatabaseAsync(
        this IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SlotlyDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<TenantContext>();

        await context.Database.MigrateAsync(cancellationToken);

        await SeedTenantAsync(
            context,
            tenantContext,
            "Northstar Health Clinic",
            "northstar-health",
            "Amira Benali",
            "amira@northstar.example",
            [
                ("General Consultation", TimeSpan.FromMinutes(30), new Money(350, "MAD"), TimeSpan.FromMinutes(10)),
                ("Physiotherapy Session", TimeSpan.FromMinutes(60), new Money(500, "MAD"), TimeSpan.FromMinutes(15)),
            ],
            cancellationToken);

        await SeedTenantAsync(
            context,
            tenantContext,
            "Atlas Wellness Studio",
            "atlas-wellness",
            "Youssef Idrissi",
            "youssef@atlas.example",
            [
                ("Personal Training", TimeSpan.FromMinutes(60), new Money(300, "MAD"), TimeSpan.FromMinutes(15)),
                ("Sports Massage", TimeSpan.FromMinutes(45), new Money(400, "MAD"), TimeSpan.FromMinutes(15)),
            ],
            cancellationToken);

        tenantContext.Clear();
    }

    private static async Task SeedTenantAsync(
        SlotlyDbContext context,
        TenantContext tenantContext,
        string tenantName,
        string tenantSlug,
        string staffName,
        string staffEmail,
        IReadOnlyCollection<(string Name, TimeSpan Duration, Money Price, TimeSpan Buffer)> services,
        CancellationToken cancellationToken)
    {
        var tenant = await context.Tenants.SingleOrDefaultAsync(
            candidate => candidate.Slug == tenantSlug,
            cancellationToken);

        if (tenant is null)
        {
            tenant = Tenant.Create(tenantName, tenantSlug);
            tenant.ConfigureBookingPolicy("Africa/Casablanca", 24);
            context.Tenants.Add(tenant);
            await context.SaveChangesAsync(cancellationToken);
        }

        tenantContext.SetTenant(tenant.Id);
        if (await context.Services.AnyAsync(cancellationToken))
        {
            context.ChangeTracker.Clear();
            return;
        }

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        var user = User.Create(
            tenant.Id,
            staffEmail,
            staffName,
            UserRole.TenantOwner,
            passwordHasher.HashPassword(null!, "Password123!"));
        var staff = Staff.Create(tenant.Id, user.Id, staffName, staffEmail);
        context.Users.Add(user);
        context.Staff.Add(staff);


        Service? primaryService = null;
        foreach (var service in services)
        {
            var createdService = Service.Create(
                tenant.Id,
                service.Name,
                service.Duration,
                service.Price,
                service.Buffer);
            context.Services.Add(createdService);
            primaryService ??= createdService;
        }

        if (primaryService is not null && tenantSlug == "northstar-health")
        {
            var customer = Customer.Create(tenant.Id, "Karim Tazi", "karim@example.com", "+212600000002");
            context.Customers.Add(customer);

            var nextWeekday = DateTimeOffset.UtcNow.Date.AddDays(1);
            while (nextWeekday.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            {
                nextWeekday = nextWeekday.AddDays(1);
            }
            var slot = new TimeSlot(nextWeekday.AddHours(14), nextWeekday.AddHours(14).Add(primaryService.Duration));
            var sampleBooking = Booking.Create(tenant.Id, customer.Id, primaryService.Id, staff.Id, slot, primaryService.BufferTime);
            sampleBooking.Confirm();
            context.Bookings.Add(sampleBooking);
        }

        foreach (var day in new[]
                 {
                     DayOfWeek.Monday,
                     DayOfWeek.Tuesday,
                     DayOfWeek.Wednesday,
                     DayOfWeek.Thursday,
                     DayOfWeek.Friday,
                 })
        {
            var hours = WorkingHours.Create(
                tenant.Id,
                staff.Id,
                day,
                new DailyTimeRange(new TimeOnly(9, 0), new TimeOnly(17, 0)));
            hours.AddBreak(new DailyTimeRange(new TimeOnly(12, 30), new TimeOnly(13, 30)));
            context.WorkingHours.Add(hours);
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        context.ChangeTracker.Clear();
    }
}
