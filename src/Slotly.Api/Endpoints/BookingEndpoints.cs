using System.Data;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Slotly.Application.Bookings;
using Slotly.Application.Common.Interfaces;
using Slotly.Application.Common.Models;
using Slotly.Domain.Bookings;
using Slotly.Domain.Customers;
using Slotly.Domain.Services;
using Slotly.Domain.Staff;
using Slotly.Domain.Tenants;
using Slotly.Domain.ValueObjects;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Api.Endpoints;

public static class BookingEndpoints
{
    public static IEndpointRouteBuilder MapBookingEndpoints(this IEndpointRouteBuilder routes)
    {
        var availability = routes.MapGroup("/api/v1/availability")
            .WithTags("Availability")
            .RequireAuthorization(AuthorizationPolicies.CustomerOnly);
        availability.MapGet("/", GetAvailabilityAsync)
            .WithName("GetAvailability")
            .WithSummary("Returns free service slots for one staff member or any active staff member.")
            .WithDescription("Dates are interpreted in the tenant time zone. Results include UTC and local offsets, including both valid occurrences during a daylight-saving overlap. Example: GET /api/v1/availability?serviceId={serviceId}&startsOn=2026-11-02&endsOn=2026-11-08&staffId={staffId}");

        var bookings = routes.MapGroup("/api/v1/bookings")
            .WithTags("Bookings")
            .RequireAuthorization(AuthorizationPolicies.CustomerOnly);
        bookings.MapPost("/", CreateBookingAsync)
            .WithName("CreateBooking")
            .WithSummary("Creates a confirmed booking after transactional availability validation.")
            .WithDescription("Example body: {\"serviceId\":\"11111111-1111-1111-1111-111111111111\",\"staffId\":\"22222222-2222-2222-2222-222222222222\",\"startsAt\":\"2026-11-02T09:00:00Z\",\"customerId\":null,\"customerName\":\"Sara Martin\",\"customerEmail\":\"sara@example.com\",\"customerPhone\":\"+212600000000\",\"notes\":\"First visit\"}");
        bookings.MapGet("/{id:guid}", GetBookingAsync)
            .WithName("GetBooking")
            .WithSummary("Gets a tenant booking.")
            .WithDescription("Example: GET /api/v1/bookings/33333333-3333-3333-3333-333333333333");
        bookings.MapGet("/", ListBookingsAsync)
            .WithName("ListBookings")
            .WithSummary("Lists tenant bookings with filters and pagination.")
            .WithDescription("Example: GET /api/v1/bookings?page=1&pageSize=20&staffId={staffId}&status=Confirmed&startsFrom=2026-11-01T00:00:00Z&startsTo=2026-12-01T00:00:00Z");
        bookings.MapPost("/{id:guid}/cancel", CancelBookingAsync)
            .WithName("CancelBooking")
            .WithSummary("Cancels a booking when the tenant cancellation window permits it.")
            .WithDescription("Example body: {\"version\":\"44444444-4444-4444-4444-444444444444\",\"reason\":\"Customer requested cancellation\"}");
        bookings.MapPost("/{id:guid}/reschedule", RescheduleBookingAsync)
            .WithName("RescheduleBooking")
            .WithSummary("Moves a booking after transactional availability validation.")
            .WithDescription("Example body: {\"version\":\"44444444-4444-4444-4444-444444444444\",\"startsAt\":\"2026-11-03T10:00:00Z\",\"staffId\":null}");
        bookings.MapPost("/{id:guid}/complete", CompleteBookingAsync)
            .RequireAuthorization(AuthorizationPolicies.StaffOnly)
            .WithName("CompleteBooking")
            .WithSummary("Marks a confirmed booking completed.")
            .WithDescription("Example body: {\"version\":\"44444444-4444-4444-4444-444444444444\"}");
        bookings.MapPost("/{id:guid}/no-show", MarkNoShowAsync)
            .RequireAuthorization(AuthorizationPolicies.StaffOnly)
            .WithName("MarkBookingNoShow")
            .WithSummary("Marks a confirmed booking as a no-show.")
            .WithDescription("Example body: {\"version\":\"44444444-4444-4444-4444-444444444444\"}");

        return routes;
    }

    private static async Task<IResult> GetAvailabilityAsync(
        Guid serviceId,
        DateOnly startsOn,
        DateOnly endsOn,
        Guid? staffId,
        SlotlyDbContext dbContext,
        IAvailabilityEngine availabilityEngine,
        ITenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        var tenantId = RequiredTenantId(tenantContext);
        var tenant = await dbContext.Tenants.AsNoTracking()
            .SingleAsync(candidate => candidate.Id == tenantId, cancellationToken);
        var service = await dbContext.Services.AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == serviceId && candidate.IsActive, cancellationToken);
        if (service is null)
        {
            return Results.NotFound();
        }

        if (endsOn < startsOn || endsOn.DayNumber - startsOn.DayNumber > 31)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(endsOn)] = ["The date range must span between one and 32 calendar days."],
            });
        }

        var timeZone = FindTimeZone(tenant.TimeZoneId);
        var staffQuery = dbContext.Staff.AsNoTracking().Where(staff => staff.IsActive);
        if (staffId.HasValue)
        {
            staffQuery = staffQuery.Where(staff => staff.Id == staffId.Value);
        }

        var staffMembers = await staffQuery.ToListAsync(cancellationToken);
        if (staffId.HasValue && staffMembers.Count == 0)
        {
            return Results.NotFound();
        }

        var staffSchedules = new List<StaffAvailability>();
        foreach (var staff in staffMembers)
        {
            staffSchedules.Add(await LoadStaffAvailabilityAsync(dbContext, staff.Id, cancellationToken));
        }

        var search = new AvailabilitySearch(
            startsOn,
            endsOn,
            service.Duration,
            service.BufferTime,
            TimeSpan.FromMinutes(15),
            timeZone,
            staffSchedules);
        var slots = availabilityEngine.FindAvailableSlots(search)
            .Select(slot => new AvailabilityDto(
                slot.StaffId,
                slot.StartsAt,
                slot.EndsAt,
                slot.LocalStartsAt,
                slot.LocalEndsAt))
            .ToArray();

        return Results.Ok(slots);
    }

    private static async Task<IResult> CreateBookingAsync(
        [FromBody] CreateBookingRequest request,
        IValidator<CreateBookingRequest> validator,
        SlotlyDbContext dbContext,
        ITenantContext tenantContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        if (request.StartsAt.ToUniversalTime() <= timeProvider.GetUtcNow())
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.StartsAt)] = ["A booking must start in the future."],
            });
        }

        var tenantId = RequiredTenantId(tenantContext);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var tenant = await dbContext.Tenants.AsNoTracking()
            .SingleAsync(candidate => candidate.Id == tenantId, cancellationToken);
        var service = await dbContext.Services
            .SingleOrDefaultAsync(candidate => candidate.Id == request.ServiceId && candidate.IsActive, cancellationToken);
        if (service is null)
        {
            return Results.NotFound();
        }

        var slot = new TimeSlot(request.StartsAt, request.StartsAt.Add(service.Duration));
        if (!await IsSlotAvailableAsync(
                dbContext,
                tenant,
                service,
                request.StaffId,
                slot,
                excludedBookingId: null,
                cancellationToken))
        {
            return BookingConflict();
        }

        var customer = await ResolveCustomerAsync(dbContext, tenantId, request, cancellationToken);
        if (customer is null)
        {
            return Results.NotFound();
        }

        var booking = Booking.Create(
            tenantId,
            customer.Id,
            service.Id,
            request.StaffId,
            slot,
            service.BufferTime);
        booking.Confirm();
        dbContext.Bookings.Add(booking);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Created($"/api/v1/bookings/{booking.Id}", ToDto(booking));
    }

    private static async Task<IResult> GetBookingAsync(
        Guid id,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var booking = await dbContext.Bookings.AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        return booking is null ? Results.NotFound() : Results.Ok(ToDto(booking));
    }

    private static async Task<IResult> ListBookingsAsync(
        SlotlyDbContext dbContext,
        int page = 1,
        int pageSize = 20,
        Guid? staffId = null,
        Guid? customerId = null,
        BookingStatus? status = null,
        DateTimeOffset? startsAfter = null,
        DateTimeOffset? startsBefore = null,
        CancellationToken cancellationToken = default)
    {
        if (page <= 0 || pageSize is <= 0 or > 100)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["pagination"] = ["Page must be positive and pageSize must be between 1 and 100."],
            });
        }

        var query = dbContext.Bookings.AsNoTracking();
        if (staffId.HasValue)
        {
            query = query.Where(booking => booking.StaffId == staffId.Value);
        }

        if (customerId.HasValue)
        {
            query = query.Where(booking => booking.CustomerId == customerId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(booking => booking.Status == status.Value);
        }

        if (startsAfter.HasValue)
        {
            query = query.Where(booking => EF.Property<DateTimeOffset>(booking, "_startsAt") >= startsAfter.Value);
        }

        if (startsBefore.HasValue)
        {
            query = query.Where(booking => EF.Property<DateTimeOffset>(booking, "_startsAt") < startsBefore.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var entities = await query.OrderBy(booking => EF.Property<DateTimeOffset>(booking, "_startsAt"))
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return Results.Ok(new PagedResponse<BookingDto>(entities.Select(ToDto).ToArray(), page, pageSize, total));
    }

    private static async Task<IResult> CancelBookingAsync(
        Guid id,
        [FromBody] CancelBookingRequest request,
        IValidator<CancelBookingRequest> validator,
        SlotlyDbContext dbContext,
        ITenantContext tenantContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var booking = await dbContext.Bookings.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (booking is null)
        {
            return Results.NotFound();
        }

        if (booking.Version != request.Version)
        {
            return BookingConflict();
        }

        var tenantId = RequiredTenantId(tenantContext);
        var tenant = await dbContext.Tenants.AsNoTracking()
            .SingleAsync(candidate => candidate.Id == tenantId, cancellationToken);
        var cancellationDeadline = booking.Slot.StartsAt.AddHours(-tenant.CancellationWindowHours);
        if (timeProvider.GetUtcNow() > cancellationDeadline)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Cancellation window closed",
                detail: $"Bookings must be cancelled at least {tenant.CancellationWindowHours} hours before they start.");
        }

        booking.Cancel(request.Reason);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToDto(booking));
    }

    private static async Task<IResult> RescheduleBookingAsync(
        Guid id,
        [FromBody] RescheduleBookingRequest request,
        IValidator<RescheduleBookingRequest> validator,
        SlotlyDbContext dbContext,
        ITenantContext tenantContext,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        if (request.StartsAt.ToUniversalTime() <= timeProvider.GetUtcNow())
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.StartsAt)] = ["A booking must start in the future."],
            });
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);
        var booking = await dbContext.Bookings.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (booking is null)
        {
            return Results.NotFound();
        }

        if (booking.Version != request.Version)
        {
            return BookingConflict();
        }

        var service = await dbContext.Services.SingleAsync(candidate => candidate.Id == booking.ServiceId, cancellationToken);
        var tenantId = RequiredTenantId(tenantContext);
        var tenant = await dbContext.Tenants.AsNoTracking()
            .SingleAsync(candidate => candidate.Id == tenantId, cancellationToken);
        var staffId = request.StaffId ?? booking.StaffId;
        var slot = new TimeSlot(request.StartsAt, request.StartsAt.Add(service.Duration));
        if (!await IsSlotAvailableAsync(
                dbContext,
                tenant,
                service,
                staffId,
                slot,
                booking.Id,
                cancellationToken))
        {
            return BookingConflict();
        }

        booking.Reschedule(staffId, slot, service.BufferTime);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Results.Ok(ToDto(booking));
    }

    private static Task<IResult> CompleteBookingAsync(
        Guid id,
        [FromBody] BookingStateRequest request,
        IValidator<BookingStateRequest> validator,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
        => ChangeBookingStateAsync(
            id,
            request,
            validator,
            dbContext,
            booking => booking.Complete(),
            cancellationToken);

    private static Task<IResult> MarkNoShowAsync(
        Guid id,
        [FromBody] BookingStateRequest request,
        IValidator<BookingStateRequest> validator,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
        => ChangeBookingStateAsync(
            id,
            request,
            validator,
            dbContext,
            booking => booking.MarkNoShow(),
            cancellationToken);

    private static async Task<IResult> ChangeBookingStateAsync(
        Guid id,
        BookingStateRequest request,
        IValidator<BookingStateRequest> validator,
        SlotlyDbContext dbContext,
        Action<Booking> changeState,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var booking = await dbContext.Bookings.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (booking is null)
        {
            return Results.NotFound();
        }

        if (booking.Version != request.Version)
        {
            return BookingConflict();
        }

        changeState(booking);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToDto(booking));
    }

    private static async Task<Customer?> ResolveCustomerAsync(
        SlotlyDbContext dbContext,
        Guid tenantId,
        CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CustomerId.HasValue)
        {
            return await dbContext.Customers.SingleOrDefaultAsync(
                customer => customer.Id == request.CustomerId.Value,
                cancellationToken);
        }

        var email = request.CustomerEmail!.Trim().ToLowerInvariant();
        var existing = await dbContext.Customers.SingleOrDefaultAsync(
            customer => customer.Email == email,
            cancellationToken);
        if (existing is not null)
        {
            existing.UpdateContactDetails(request.CustomerName!, email, request.CustomerPhone);
            return existing;
        }

        var customer = Customer.Create(tenantId, request.CustomerName!, email, request.CustomerPhone);
        dbContext.Customers.Add(customer);
        return customer;
    }

    private static async Task<StaffAvailability> LoadStaffAvailabilityAsync(
        SlotlyDbContext dbContext,
        Guid staffId,
        CancellationToken cancellationToken)
    {
        var workingHours = await dbContext.WorkingHours.AsNoTracking()
            .Include(hours => hours.Breaks)
            .Where(hours => hours.StaffId == staffId)
            .ToListAsync(cancellationToken);
        var timeOff = await dbContext.TimeOff.AsNoTracking()
            .Where(entry => entry.StaffId == staffId)
            .ToListAsync(cancellationToken);
        var bookings = await dbContext.Bookings.AsNoTracking()
            .Where(booking => booking.StaffId == staffId
                && (booking.Status == BookingStatus.Pending || booking.Status == BookingStatus.Confirmed))
            .ToListAsync(cancellationToken);

        return new StaffAvailability(
            staffId,
            workingHours.Select(hours => new WorkingDayAvailability(
                hours.DayOfWeek,
                hours.Range,
                hours.Breaks.Select(workingBreak => workingBreak.Range).ToArray())).ToArray(),
            timeOff.Select(entry => new BusyPeriod(entry.Slot.StartsAt, entry.Slot.EndsAt)).ToArray(),
            bookings.Select(booking => new BusyPeriod(booking.Slot.StartsAt, booking.BlockedUntil)).ToArray());
    }

    private static async Task<bool> IsSlotAvailableAsync(
        SlotlyDbContext dbContext,
        Tenant tenant,
        Service service,
        Guid staffId,
        TimeSlot slot,
        Guid? excludedBookingId,
        CancellationToken cancellationToken)
    {
        if (!await dbContext.Staff.AnyAsync(staff => staff.Id == staffId && staff.IsActive, cancellationToken))
        {
            return false;
        }

        var timeZone = FindTimeZone(tenant.TimeZoneId);
        var localStart = TimeZoneInfo.ConvertTime(slot.StartsAt, timeZone);
        var localEnd = TimeZoneInfo.ConvertTime(slot.EndsAt, timeZone);
        var localBlockedUntil = TimeZoneInfo.ConvertTime(slot.EndsAt.Add(service.BufferTime), timeZone);
        if (localStart.Date != localEnd.Date)
        {
            return false;
        }

        var hours = await dbContext.WorkingHours.AsNoTracking()
            .Include(entry => entry.Breaks)
            .SingleOrDefaultAsync(
                entry => entry.StaffId == staffId && entry.DayOfWeek == localStart.DayOfWeek,
                cancellationToken);
        if (hours is null
            || TimeOnly.FromDateTime(localStart.DateTime) < hours.Range.StartsAt
            || TimeOnly.FromDateTime(localEnd.DateTime) > hours.Range.EndsAt)
        {
            return false;
        }

        var candidateStart = TimeOnly.FromDateTime(localStart.DateTime);
        var candidateBlockedUntil = TimeOnly.FromDateTime(localBlockedUntil.DateTime);
        if (hours.Breaks.Any(workingBreak =>
                candidateStart < workingBreak.Range.EndsAt
                && candidateBlockedUntil > workingBreak.Range.StartsAt))
        {
            return false;
        }

        var startsAt = slot.StartsAt;
        var blockedUntil = slot.EndsAt.Add(service.BufferTime);
        var hasTimeOff = await dbContext.TimeOff.AnyAsync(
            entry => entry.StaffId == staffId
                && EF.Property<DateTimeOffset>(entry, "_startsAt") < blockedUntil
                && EF.Property<DateTimeOffset>(entry, "_endsAt") > startsAt,
            cancellationToken);
        if (hasTimeOff)
        {
            return false;
        }

        return !await dbContext.Bookings.AnyAsync(
            booking => booking.StaffId == staffId
                && (!excludedBookingId.HasValue || booking.Id != excludedBookingId.Value)
                && (booking.Status == BookingStatus.Pending || booking.Status == BookingStatus.Confirmed)
                && EF.Property<DateTimeOffset>(booking, "_startsAt") < blockedUntil
                && EF.Property<DateTimeOffset>(booking, "_blockedUntil") > startsAt,
            cancellationToken);
    }

    private static TimeZoneInfo FindTimeZone(string timeZoneId)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (TimeZoneNotFoundException exception)
        {
            throw new InvalidOperationException(
                $"Tenant time zone '{timeZoneId}' is not installed on this host.",
                exception);
        }
    }

    private static BookingDto ToDto(Booking booking)
        => new(
            booking.Id,
            booking.CustomerId,
            booking.ServiceId,
            booking.StaffId,
            booking.Slot.StartsAt,
            booking.Slot.EndsAt,
            booking.BlockedUntil,
            booking.Status,
            booking.CancellationReason,
            booking.Version);

    private static Guid RequiredTenantId(ITenantContext tenantContext)
        => tenantContext.TenantId
            ?? throw new InvalidOperationException("An active tenant is required.");

    private static IResult BookingConflict()
        => Results.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Booking conflict",
            detail: "The requested slot is not available or the booking version is stale.");

    private static IResult ValidationProblem(ValidationResult validation)
        => Results.ValidationProblem(validation.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray()));
}
