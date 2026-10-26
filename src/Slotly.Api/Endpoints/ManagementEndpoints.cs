using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Slotly.Application.Common.Interfaces;
using Slotly.Application.Common.Models;
using Slotly.Application.Management;
using Slotly.Domain.Services;
using Slotly.Domain.Staff;
using Slotly.Domain.ValueObjects;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;
using Slotly.Api.Infrastructure;

namespace Slotly.Api.Endpoints;

public static class ManagementEndpoints
{
    public static IEndpointRouteBuilder MapManagementEndpoints(this IEndpointRouteBuilder routes)
    {
        MapServiceEndpoints(routes);
        MapStaffEndpoints(routes);
        MapWorkingHoursEndpoints(routes);
        MapTimeOffEndpoints(routes);
        return routes;
    }

    private static void MapServiceEndpoints(IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/services")
            .WithTags("Services")
            .RequireRateLimiting("tenant-api")
            .RequireAuthorization(AuthorizationPolicies.ActiveTenantOnly);

        group.MapGet("/", ListServicesAsync)
            .AllowAnonymous()
            .WithName("ListServices")
            .WithSummary("Lists tenant services with pagination.")
            .WithDescription("Example: GET /api/v1/services?page=1&pageSize=20&includeInactive=false");
        group.MapGet("/{id:guid}", GetServiceAsync)
            .WithName("GetService")
            .WithSummary("Gets a tenant service.")
            .WithDescription("Example: GET /api/v1/services/11111111-1111-1111-1111-111111111111");
        group.MapPost("/", CreateServiceAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("CreateService")
            .WithSummary("Creates a service for the active tenant.")
            .WithDescription("Example body: {\"name\":\"Physiotherapy\",\"durationMinutes\":45,\"priceAmount\":65,\"currency\":\"EUR\",\"bufferMinutes\":15}");
        group.MapPut("/{id:guid}", UpdateServiceAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("UpdateService")
            .WithSummary("Updates a tenant service.")
            .WithDescription("Example body: {\"name\":\"Physiotherapy follow-up\",\"durationMinutes\":30,\"priceAmount\":45,\"currency\":\"EUR\",\"bufferMinutes\":10}");
        group.MapDelete("/{id:guid}", DeleteServiceAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("DeleteService")
            .WithSummary("Deactivates a tenant service.")
            .WithDescription("Example: DELETE /api/v1/services/11111111-1111-1111-1111-111111111111");
    }

    private static void MapStaffEndpoints(IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/staff")
            .WithTags("Staff")
            .RequireRateLimiting("tenant-api")
            .RequireAuthorization(AuthorizationPolicies.ActiveTenantOnly);

        group.MapGet("/", ListStaffAsync).AllowAnonymous().WithName("ListStaff").WithSummary("Lists staff with pagination.")
            .WithDescription("Example: GET /api/v1/staff?page=1&pageSize=20&includeInactive=false");
        group.MapGet("/{id:guid}", GetStaffAsync).WithName("GetStaff").WithSummary("Gets a staff member.")
            .WithDescription("Example: GET /api/v1/staff/22222222-2222-2222-2222-222222222222");
        group.MapPost("/", CreateStaffAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("CreateStaff")
            .WithSummary("Creates a staff profile.")
            .WithDescription("Example body: {\"displayName\":\"Amina Haddad\",\"email\":\"amina@example.com\"}");
        group.MapPut("/{id:guid}", UpdateStaffAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("UpdateStaff")
            .WithSummary("Updates a staff profile.")
            .WithDescription("Example body: {\"displayName\":\"Amina Haddad\",\"email\":\"amina.haddad@example.com\"}");
        group.MapDelete("/{id:guid}", DeleteStaffAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("DeleteStaff")
            .WithSummary("Deactivates a staff profile.")
            .WithDescription("Example: DELETE /api/v1/staff/22222222-2222-2222-2222-222222222222");
    }

    private static void MapWorkingHoursEndpoints(IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/staff/{staffId:guid}/working-hours")
            .WithTags("Working Hours")
            .RequireRateLimiting("tenant-api")
            .RequireAuthorization(AuthorizationPolicies.ActiveTenantOnly);

        group.MapGet("/", ListWorkingHoursAsync)
            .WithName("ListWorkingHours")
            .WithSummary("Lists a staff member's weekly working hours.")
            .WithDescription("Example: GET /api/v1/staff/22222222-2222-2222-2222-222222222222/working-hours");
        group.MapPost("/", CreateWorkingHoursAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("CreateWorkingHours")
            .WithSummary("Creates working hours and breaks for a weekday.")
            .WithDescription("Example body: {\"dayOfWeek\":1,\"startsAt\":\"09:00:00\",\"endsAt\":\"17:00:00\",\"breaks\":[{\"startsAt\":\"12:00:00\",\"endsAt\":\"13:00:00\"}]}");
        group.MapPut("/{id:guid}", UpdateWorkingHoursAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("UpdateWorkingHours")
            .WithSummary("Updates working hours and replaces their breaks.")
            .WithDescription("Example body: {\"dayOfWeek\":1,\"startsAt\":\"08:30:00\",\"endsAt\":\"16:30:00\",\"breaks\":[]}");
        group.MapDelete("/{id:guid}", DeleteWorkingHoursAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("DeleteWorkingHours")
            .WithSummary("Deletes a working-hours entry.")
            .WithDescription("Example: DELETE /api/v1/staff/{staffId}/working-hours/{workingHoursId}");
    }

    private static void MapTimeOffEndpoints(IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/staff/{staffId:guid}/time-off")
            .WithTags("Time Off")
            .RequireRateLimiting("tenant-api")
            .RequireAuthorization(AuthorizationPolicies.ActiveTenantOnly);

        group.MapGet("/", ListTimeOffAsync)
            .WithName("ListTimeOff")
            .WithSummary("Lists a staff member's time off with pagination.")
            .WithDescription("Example: GET /api/v1/staff/{staffId}/time-off?page=1&pageSize=20");
        group.MapGet("/{id:guid}", GetTimeOffAsync)
            .WithName("GetTimeOff")
            .WithSummary("Gets a time-off entry.")
            .WithDescription("Example: GET /api/v1/staff/{staffId}/time-off/{timeOffId}");
        group.MapPost("/", CreateTimeOffAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("CreateTimeOff")
            .WithSummary("Creates a time-off entry.")
            .WithDescription("Example body: {\"startsAt\":\"2026-12-24T09:00:00Z\",\"endsAt\":\"2026-12-24T17:00:00Z\",\"reason\":\"Annual leave\"}");
        group.MapPut("/{id:guid}", UpdateTimeOffAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("UpdateTimeOff")
            .WithSummary("Updates a time-off entry.")
            .WithDescription("Example body: {\"startsAt\":\"2026-12-24T10:00:00Z\",\"endsAt\":\"2026-12-24T16:00:00Z\",\"reason\":\"Annual leave\"}");
        group.MapDelete("/{id:guid}", DeleteTimeOffAsync)
            .RequireAuthorization(AuthorizationPolicies.TenantOwnerOnly)
            .WithName("DeleteTimeOff")
            .WithSummary("Deletes a time-off entry.")
            .WithDescription("Example: DELETE /api/v1/staff/{staffId}/time-off/{timeOffId}");
    }

    private static async Task<IResult> ListServicesAsync(
        SlotlyDbContext dbContext,
        int page = 1,
        int pageSize = 20,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        if (!IsValidPage(page, pageSize))
        {
            return InvalidPagination();
        }

        var query = dbContext.Services.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(service => service.IsActive);
        }

        var total = await query.CountAsync(cancellationToken);
        var entities = await query.OrderBy(service => service.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return Results.Ok(new PagedResponse<ServiceDto>(entities.Select(ToDto).ToArray(), page, pageSize, total));
    }

    private static async Task<IResult> GetServiceAsync(
        Guid id,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var service = await dbContext.Services.AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        return service is null ? Results.NotFound() : Results.Ok(ToDto(service));
    }

    private static async Task<IResult> CreateServiceAsync(
        [FromBody] ServiceRequest request,
        IValidator<ServiceRequest> validator,
        ITenantContext tenantContext,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var service = Service.Create(
            RequiredTenantId(tenantContext),
            request.Name,
            TimeSpan.FromMinutes(request.DurationMinutes),
            new Money(request.PriceAmount, request.Currency),
            TimeSpan.FromMinutes(request.BufferMinutes));
        dbContext.Services.Add(service);
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(service.TenantId, cancellationToken);
        return Results.Created($"/api/v1/services/{service.Id}", ToDto(service));
    }

    private static async Task<IResult> UpdateServiceAsync(
        Guid id,
        [FromBody] ServiceRequest request,
        IValidator<ServiceRequest> validator,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var service = await dbContext.Services.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (service is null)
        {
            return Results.NotFound();
        }

        service.Update(
            request.Name,
            TimeSpan.FromMinutes(request.DurationMinutes),
            new Money(request.PriceAmount, request.Currency),
            TimeSpan.FromMinutes(request.BufferMinutes));
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateServiceAsync(service.TenantId, service.Id, cancellationToken);
        return Results.Ok(ToDto(service));
    }

    private static async Task<IResult> DeleteServiceAsync(
        Guid id,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var service = await dbContext.Services.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (service is null)
        {
            return Results.NotFound();
        }

        service.Deactivate();
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateServiceAsync(service.TenantId, service.Id, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ListStaffAsync(
        SlotlyDbContext dbContext,
        int page = 1,
        int pageSize = 20,
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        if (!IsValidPage(page, pageSize))
        {
            return InvalidPagination();
        }

        var query = dbContext.Staff.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(staff => staff.IsActive);
        }

        var total = await query.CountAsync(cancellationToken);
        var entities = await query.OrderBy(staff => staff.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return Results.Ok(new PagedResponse<StaffDto>(entities.Select(ToDto).ToArray(), page, pageSize, total));
    }

    private static async Task<IResult> GetStaffAsync(
        Guid id,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var staff = await dbContext.Staff.AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        return staff is null ? Results.NotFound() : Results.Ok(ToDto(staff));
    }

    private static async Task<IResult> CreateStaffAsync(
        [FromBody] StaffRequest request,
        IValidator<StaffRequest> validator,
        ITenantContext tenantContext,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var tenantId = RequiredTenantId(tenantContext);
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await dbContext.Staff.AnyAsync(staff => staff.Email == normalizedEmail, cancellationToken))
        {
            return Conflict("Staff email already exists", "A staff member with this email already exists.");
        }

        if (request.UserId.HasValue
            && !await dbContext.Users.AnyAsync(user => user.Id == request.UserId.Value, cancellationToken))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.UserId)] = ["The linked user does not exist in this tenant."],
            });
        }

        var staff = Staff.Create(tenantId, request.UserId, request.DisplayName, normalizedEmail);
        dbContext.Staff.Add(staff);
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(staff.TenantId, cancellationToken);
        return Results.Created($"/api/v1/staff/{staff.Id}", ToDto(staff));
    }

    private static async Task<IResult> UpdateStaffAsync(
        Guid id,
        [FromBody] StaffRequest request,
        IValidator<StaffRequest> validator,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var staff = await dbContext.Staff.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (staff is null)
        {
            return Results.NotFound();
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await dbContext.Staff.AnyAsync(candidate => candidate.Id != id && candidate.Email == normalizedEmail, cancellationToken))
        {
            return Conflict("Staff email already exists", "A staff member with this email already exists.");
        }

        staff.UpdateProfile(request.DisplayName, normalizedEmail);
        if (request.UserId.HasValue && request.UserId != staff.UserId)
        {
            if (!await dbContext.Users.AnyAsync(user => user.Id == request.UserId.Value, cancellationToken))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.UserId)] = ["The linked user does not exist in this tenant."],
                });
            }

            staff.LinkUser(request.UserId.Value);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(staff.TenantId, cancellationToken);
        return Results.Ok(ToDto(staff));
    }

    private static async Task<IResult> DeleteStaffAsync(
        Guid id,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var staff = await dbContext.Staff.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (staff is null)
        {
            return Results.NotFound();
        }

        staff.Deactivate();
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(staff.TenantId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ListWorkingHoursAsync(
        Guid staffId,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (!await dbContext.Staff.AnyAsync(staff => staff.Id == staffId, cancellationToken))
        {
            return Results.NotFound();
        }

        var hours = await dbContext.WorkingHours.AsNoTracking()
            .Include(entry => entry.Breaks)
            .Where(entry => entry.StaffId == staffId)
            .OrderBy(entry => entry.DayOfWeek)
            .ToListAsync(cancellationToken);
        return Results.Ok(hours.Select(ToDto).ToArray());
    }

    private static async Task<IResult> CreateWorkingHoursAsync(
        Guid staffId,
        [FromBody] WorkingHoursRequest request,
        IValidator<WorkingHoursRequest> validator,
        ITenantContext tenantContext,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        if (!await dbContext.Staff.AnyAsync(staff => staff.Id == staffId && staff.IsActive, cancellationToken))
        {
            return Results.NotFound();
        }

        if (await dbContext.WorkingHours.AnyAsync(
                entry => entry.StaffId == staffId && entry.DayOfWeek == request.DayOfWeek,
                cancellationToken))
        {
            return Conflict("Working hours already exist", "This staff member already has hours for that weekday.");
        }

        var hours = BuildWorkingHours(RequiredTenantId(tenantContext), staffId, request);
        dbContext.WorkingHours.Add(hours);
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(hours.TenantId, cancellationToken);
        return Results.Created($"/api/v1/staff/{staffId}/working-hours/{hours.Id}", ToDto(hours));
    }

    private static async Task<IResult> UpdateWorkingHoursAsync(
        Guid staffId,
        Guid id,
        [FromBody] WorkingHoursRequest request,
        IValidator<WorkingHoursRequest> validator,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var hours = await dbContext.WorkingHours.Include(entry => entry.Breaks)
            .SingleOrDefaultAsync(entry => entry.Id == id && entry.StaffId == staffId, cancellationToken);
        if (hours is null)
        {
            return Results.NotFound();
        }

        if (request.DayOfWeek != hours.DayOfWeek)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.DayOfWeek)] = ["The weekday of an existing schedule cannot be changed."],
            });
        }

        var newRange = new DailyTimeRange(request.StartsAt, request.EndsAt);
        foreach (var workingBreak in hours.Breaks.ToArray())
        {
            hours.RemoveBreak(workingBreak.Id);
        }

        hours.ChangeRange(newRange);
        try
        {
            foreach (var requestedBreak in request.Breaks.OrderBy(value => value.StartsAt))
            {
                var addedBreak = hours.AddBreak(new DailyTimeRange(
                    requestedBreak.StartsAt,
                    requestedBreak.EndsAt));
                dbContext.WorkingHoursBreaks.Add(addedBreak);
            }
        }
        catch (InvalidOperationException exception)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(request.Breaks)] = [exception.Message],
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(hours.TenantId, cancellationToken);
        return Results.Ok(ToDto(hours));
    }

    private static async Task<IResult> DeleteWorkingHoursAsync(
        Guid staffId,
        Guid id,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var hours = await dbContext.WorkingHours
            .SingleOrDefaultAsync(entry => entry.Id == id && entry.StaffId == staffId, cancellationToken);
        if (hours is null)
        {
            return Results.NotFound();
        }

        dbContext.WorkingHours.Remove(hours);
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(hours.TenantId, cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> ListTimeOffAsync(
        Guid staffId,
        SlotlyDbContext dbContext,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (!IsValidPage(page, pageSize))
        {
            return InvalidPagination();
        }

        var query = dbContext.TimeOff.AsNoTracking().Where(entry => entry.StaffId == staffId);
        var total = await query.CountAsync(cancellationToken);
        var entries = await query.OrderBy(entry => EF.Property<DateTimeOffset>(entry, "_startsAt"))
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return Results.Ok(new PagedResponse<TimeOffDto>(entries.Select(ToDto).ToArray(), page, pageSize, total));
    }

    private static async Task<IResult> GetTimeOffAsync(
        Guid staffId,
        Guid id,
        SlotlyDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var entry = await dbContext.TimeOff.AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.StaffId == staffId, cancellationToken);
        return entry is null ? Results.NotFound() : Results.Ok(ToDto(entry));
    }

    private static async Task<IResult> CreateTimeOffAsync(
        Guid staffId,
        [FromBody] TimeOffRequest request,
        IValidator<TimeOffRequest> validator,
        ITenantContext tenantContext,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        if (!await dbContext.Staff.AnyAsync(staff => staff.Id == staffId && staff.IsActive, cancellationToken))
        {
            return Results.NotFound();
        }

        var entry = TimeOff.Create(
            RequiredTenantId(tenantContext),
            staffId,
            new TimeSlot(request.StartsAt, request.EndsAt),
            request.Reason);
        dbContext.TimeOff.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(entry.TenantId, cancellationToken);
        return Results.Created($"/api/v1/staff/{staffId}/time-off/{entry.Id}", ToDto(entry));
    }

    private static async Task<IResult> UpdateTimeOffAsync(
        Guid staffId,
        Guid id,
        [FromBody] TimeOffRequest request,
        IValidator<TimeOffRequest> validator,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(validation);
        }

        var entry = await dbContext.TimeOff
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.StaffId == staffId, cancellationToken);
        if (entry is null)
        {
            return Results.NotFound();
        }

        entry.Update(new TimeSlot(request.StartsAt, request.EndsAt), request.Reason);
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(entry.TenantId, cancellationToken);
        return Results.Ok(ToDto(entry));
    }

    private static async Task<IResult> DeleteTimeOffAsync(
        Guid staffId,
        Guid id,
        SlotlyDbContext dbContext,
        AvailabilityCache availabilityCache,
        CancellationToken cancellationToken)
    {
        var entry = await dbContext.TimeOff
            .SingleOrDefaultAsync(candidate => candidate.Id == id && candidate.StaffId == staffId, cancellationToken);
        if (entry is null)
        {
            return Results.NotFound();
        }

        dbContext.TimeOff.Remove(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
        await availabilityCache.InvalidateTenantAsync(entry.TenantId, cancellationToken);
        return Results.NoContent();
    }

    private static WorkingHours BuildWorkingHours(Guid tenantId, Guid staffId, WorkingHoursRequest request)
    {
        var hours = WorkingHours.Create(
            tenantId,
            staffId,
            request.DayOfWeek,
            new DailyTimeRange(request.StartsAt, request.EndsAt));
        AddBreaks(hours, request.Breaks);
        return hours;
    }

    private static void AddBreaks(WorkingHours hours, IEnumerable<WorkingHoursBreakRequest> breaks)
    {
        foreach (var workingBreak in breaks.OrderBy(value => value.StartsAt))
        {
            hours.AddBreak(new DailyTimeRange(workingBreak.StartsAt, workingBreak.EndsAt));
        }
    }

    private static ServiceDto ToDto(Service service)
        => new(
            service.Id,
            service.Name,
            (int)service.Duration.TotalMinutes,
            service.Price.Amount,
            service.Price.Currency,
            (int)service.BufferTime.TotalMinutes,
            service.IsActive);

    private static StaffDto ToDto(Staff staff)
        => new(staff.Id, staff.UserId, staff.DisplayName, staff.Email, staff.IsActive);

    private static WorkingHoursDto ToDto(WorkingHours hours)
        => new(
            hours.Id,
            hours.StaffId,
            hours.DayOfWeek,
            hours.Range.StartsAt,
            hours.Range.EndsAt,
            hours.Breaks
                .OrderBy(workingBreak => workingBreak.Range.StartsAt)
                .Select(workingBreak => new WorkingHoursBreakRequest(
                    workingBreak.Range.StartsAt,
                    workingBreak.Range.EndsAt))
                .ToArray());

    private static TimeOffDto ToDto(TimeOff entry)
        => new(entry.Id, entry.StaffId, entry.Slot.StartsAt, entry.Slot.EndsAt, entry.Reason);

    private static bool IsValidPage(int page, int pageSize) => page > 0 && pageSize is > 0 and <= 100;

    private static IResult InvalidPagination()
        => Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["pagination"] = ["Page must be positive and pageSize must be between 1 and 100."],
        });

    private static Guid RequiredTenantId(ITenantContext tenantContext)
        => tenantContext.TenantId
            ?? throw new InvalidOperationException("An active tenant is required.");

    private static IResult Conflict(string title, string detail)
        => Results.Problem(statusCode: StatusCodes.Status409Conflict, title: title, detail: detail);

    private static IResult ValidationProblem(ValidationResult validation)
        => Results.ValidationProblem(validation.Errors
            .GroupBy(error => error.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(error => error.ErrorMessage).ToArray()));
}
