using Microsoft.AspNetCore.Identity;
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
    private const string LocalPassword = "Password123!";
    private static readonly TimeZoneInfo CasablancaTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Africa/Casablanca");

    public static async Task InitializeDatabaseAsync(
        this IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SlotlyDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<TenantContext>();

        await context.Database.MigrateAsync(cancellationToken);

        await SeedTenantAsync(context, tenantContext, NorthstarHealth(), cancellationToken);
        await SeedTenantAsync(context, tenantContext, AtlasWellness(), cancellationToken);

        tenantContext.Clear();
    }

    private static async Task SeedTenantAsync(
        SlotlyDbContext context,
        TenantContext tenantContext,
        TenantProfile profile,
        CancellationToken cancellationToken)
    {
        var tenant = await context.Tenants.SingleOrDefaultAsync(
            candidate => candidate.Slug == profile.Slug,
            cancellationToken);

        if (tenant is null)
        {
            tenant = Tenant.Create(profile.Name, profile.Slug);
            tenant.ConfigureBookingPolicy("Africa/Casablanca", profile.CancellationWindowHours);
            tenant.ConfigureBranding(profile.PrimaryColor, null);
            tenant.ConfigurePaymentPolicy(false, null);
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
        var passwordHasher = new PasswordHasher<User>();
        var staffMembers = new List<Staff>();

        foreach (var member in profile.Staff)
        {
            var user = User.Create(
                tenant.Id,
                member.Email,
                member.Name,
                member.Role,
                passwordHasher.HashPassword(null!, LocalPassword));
            var staff = Staff.Create(tenant.Id, user.Id, member.Name, member.Email);
            context.Users.Add(user);
            context.Staff.Add(staff);
            staffMembers.Add(staff);
        }

        var tenantServices = profile.Services
            .Select(service => Service.Create(
                tenant.Id,
                service.Name,
                TimeSpan.FromMinutes(service.DurationMinutes),
                new Money(service.Price, "MAD"),
                TimeSpan.FromMinutes(service.BufferMinutes)))
            .ToArray();
        context.Services.AddRange(tenantServices);

        var customers = profile.Customers
            .Select(customer => Customer.Create(
                tenant.Id,
                customer.Name,
                customer.Email,
                customer.Phone))
            .ToArray();
        context.Customers.AddRange(customers);

        AddWorkingHours(context, tenant.Id, staffMembers);
        AddTimeOff(context, tenant.Id, staffMembers, profile.TimeOffReason);
        AddBookings(context, tenant.Id, staffMembers, tenantServices, customers, profile.Bookings);

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        context.ChangeTracker.Clear();
    }

    private static void AddWorkingHours(
        SlotlyDbContext context,
        Guid tenantId,
        IReadOnlyList<Staff> staffMembers)
    {
        foreach (var (staff, index) in staffMembers.Select((staff, index) => (staff, index)))
        {
            foreach (var day in new[]
                     {
                         DayOfWeek.Monday,
                         DayOfWeek.Tuesday,
                         DayOfWeek.Wednesday,
                         DayOfWeek.Thursday,
                         DayOfWeek.Friday,
                     })
            {
                var startsAt = index == 1 ? new TimeOnly(8, 30) : new TimeOnly(9, 0);
                var endsAt = index == 2 ? new TimeOnly(18, 0) : new TimeOnly(17, 30);
                var hours = WorkingHours.Create(
                    tenantId,
                    staff.Id,
                    day,
                    new DailyTimeRange(startsAt, endsAt));
                hours.AddBreak(new DailyTimeRange(new TimeOnly(12, 30), new TimeOnly(13, 30)));
                context.WorkingHours.Add(hours);
            }

            if (index == 1)
            {
                context.WorkingHours.Add(WorkingHours.Create(
                    tenantId,
                    staff.Id,
                    DayOfWeek.Saturday,
                    new DailyTimeRange(new TimeOnly(9, 0), new TimeOnly(13, 0))));
            }
        }
    }

    private static void AddTimeOff(
        SlotlyDbContext context,
        Guid tenantId,
        IReadOnlyList<Staff> staffMembers,
        string reason)
    {
        var date = BusinessDate(8);
        var slot = new TimeSlot(ToUtc(date, new TimeOnly(9, 0)), ToUtc(date, new TimeOnly(17, 30)));
        context.TimeOff.Add(TimeOff.Create(tenantId, staffMembers[^1].Id, slot, reason));
    }

    private static void AddBookings(
        SlotlyDbContext context,
        Guid tenantId,
        List<Staff> staffMembers,
        Service[] services,
        Customer[] customers,
        IReadOnlyList<BookingProfile> profiles)
    {
        foreach (var profile in profiles)
        {
            var service = services[profile.ServiceIndex];
            var startsAt = ToUtc(BusinessDate(profile.BusinessDayOffset), profile.StartsAt);
            var booking = Booking.Create(
                tenantId,
                customers[profile.CustomerIndex].Id,
                service.Id,
                staffMembers[profile.StaffIndex].Id,
                new TimeSlot(startsAt, startsAt.Add(service.Duration)),
                service.BufferTime);

            ApplyStatus(booking, profile.Status);
            booking.ClearDomainEvents();
            context.Bookings.Add(booking);
        }
    }

    private static void ApplyStatus(Booking booking, BookingStatus status)
    {
        switch (status)
        {
            case BookingStatus.Pending:
                break;
            case BookingStatus.Confirmed:
                booking.Confirm();
                break;
            case BookingStatus.Cancelled:
                booking.Confirm();
                booking.Cancel("Customer requested a different date.");
                break;
            case BookingStatus.Completed:
                booking.Confirm();
                booking.Complete();
                break;
            case BookingStatus.NoShow:
                booking.Confirm();
                booking.MarkNoShow();
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(status), status, null);
        }
    }

    private static DateOnly BusinessDate(int offset)
    {
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        var direction = offset < 0 ? -1 : 1;
        var remaining = Math.Abs(offset);

        while (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            date = date.AddDays(direction);
        }

        while (remaining > 0)
        {
            date = date.AddDays(direction);
            if (date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            {
                remaining--;
            }
        }

        return date;
    }

    private static DateTimeOffset ToUtc(DateOnly date, TimeOnly time)
    {
        var local = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);
        return new DateTimeOffset(local, CasablancaTimeZone.GetUtcOffset(local)).ToUniversalTime();
    }

    private static TenantProfile NorthstarHealth() => new(
        "Northstar Health Clinic",
        "northstar-health",
        "#2563EB",
        24,
        [
            new StaffProfile("Dr Amira Benali", "amira.benali@northstarhealth.ma", UserRole.TenantOwner),
            new StaffProfile("Dr Nadia El Mansouri", "nadia.elmansouri@northstarhealth.ma", UserRole.Staff),
            new StaffProfile("Othmane Alaoui", "othmane.alaoui@northstarhealth.ma", UserRole.Staff),
        ],
        [
            new ServiceProfile("General Medical Consultation", 30, 350, 10),
            new ServiceProfile("Follow-up Consultation", 20, 250, 10),
            new ServiceProfile("Physiotherapy Session", 60, 500, 15),
            new ServiceProfile("Nutrition Assessment", 45, 420, 15),
        ],
        [
            new CustomerProfile("Karim Tazi", "karim.tazi@gmail.com", "+212 661 248 930"),
            new CustomerProfile("Sara El Amrani", "sara.elamrani@outlook.com", "+212 662 715 408"),
            new CustomerProfile("Mehdi Bennani", "mehdi.bennani@gmail.com", "+212 650 193 627"),
            new CustomerProfile("Lina Chraibi", "lina.chraibi@icloud.com", "+212 674 820 156"),
            new CustomerProfile("Hicham Lahlou", "hicham.lahlou@gmail.com", "+212 688 342 519"),
        ],
        [
            new BookingProfile(-3, new TimeOnly(9, 0), 0, 0, 0, BookingStatus.Completed),
            new BookingProfile(-2, new TimeOnly(10, 30), 2, 2, 1, BookingStatus.Completed),
            new BookingProfile(-1, new TimeOnly(15, 0), 1, 1, 2, BookingStatus.NoShow),
            new BookingProfile(0, new TimeOnly(10, 0), 0, 0, 3, BookingStatus.Confirmed),
            new BookingProfile(0, new TimeOnly(14, 30), 2, 2, 4, BookingStatus.Confirmed),
            new BookingProfile(1, new TimeOnly(9, 30), 3, 1, 0, BookingStatus.Confirmed),
            new BookingProfile(2, new TimeOnly(11, 0), 0, 0, 1, BookingStatus.Pending),
            new BookingProfile(3, new TimeOnly(16, 0), 2, 2, 2, BookingStatus.Cancelled),
        ],
        "Continuing education conference");

    private static TenantProfile AtlasWellness() => new(
        "Atlas Wellness Studio",
        "atlas-wellness",
        "#0F766E",
        12,
        [
            new StaffProfile("Youssef Idrissi", "youssef.idrissi@atlaswellness.ma", UserRole.TenantOwner),
            new StaffProfile("Salma Berrada", "salma.berrada@atlaswellness.ma", UserRole.Staff),
            new StaffProfile("Mehdi El Fassi", "mehdi.elfassi@atlaswellness.ma", UserRole.Staff),
        ],
        [
            new ServiceProfile("Personal Training Session", 60, 300, 15),
            new ServiceProfile("Sports Massage", 45, 400, 15),
            new ServiceProfile("Private Yoga Session", 60, 250, 10),
            new ServiceProfile("Mobility and Recovery Session", 45, 350, 15),
        ],
        [
            new CustomerProfile("Imane Zahraoui", "imane.zahraoui@gmail.com", "+212 670 412 895"),
            new CustomerProfile("Adam Filali", "adam.filali@outlook.com", "+212 653 904 271"),
            new CustomerProfile("Nora Sqalli", "nora.sqalli@gmail.com", "+212 676 238 140"),
            new CustomerProfile("Rayan Kadiri", "rayan.kadiri@icloud.com", "+212 694 517 382"),
            new CustomerProfile("Meryem Bennis", "meryem.bennis@gmail.com", "+212 648 760 935"),
        ],
        [
            new BookingProfile(-3, new TimeOnly(10, 0), 0, 0, 0, BookingStatus.Completed),
            new BookingProfile(-2, new TimeOnly(14, 0), 1, 2, 1, BookingStatus.Completed),
            new BookingProfile(-1, new TimeOnly(16, 0), 2, 1, 2, BookingStatus.Cancelled),
            new BookingProfile(0, new TimeOnly(9, 30), 0, 0, 3, BookingStatus.Confirmed),
            new BookingProfile(0, new TimeOnly(15, 30), 3, 2, 4, BookingStatus.Confirmed),
            new BookingProfile(1, new TimeOnly(10, 30), 2, 1, 0, BookingStatus.Confirmed),
            new BookingProfile(2, new TimeOnly(14, 30), 1, 2, 1, BookingStatus.Pending),
            new BookingProfile(4, new TimeOnly(11, 0), 0, 0, 2, BookingStatus.Confirmed),
        ],
        "Professional certification workshop");

    private sealed record TenantProfile(
        string Name,
        string Slug,
        string PrimaryColor,
        int CancellationWindowHours,
        IReadOnlyList<StaffProfile> Staff,
        IReadOnlyList<ServiceProfile> Services,
        IReadOnlyList<CustomerProfile> Customers,
        IReadOnlyList<BookingProfile> Bookings,
        string TimeOffReason);

    private sealed record StaffProfile(string Name, string Email, UserRole Role);

    private sealed record ServiceProfile(string Name, int DurationMinutes, decimal Price, int BufferMinutes);

    private sealed record CustomerProfile(string Name, string Email, string Phone);

    private sealed record BookingProfile(
        int BusinessDayOffset,
        TimeOnly StartsAt,
        int ServiceIndex,
        int StaffIndex,
        int CustomerIndex,
        BookingStatus Status);
}
