using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Models;
using Slotly.Application.Bookings;
using Slotly.Application.Common.Models;
using Slotly.Application.Management;
using Slotly.Domain.Bookings;
using Slotly.Infrastructure.Persistence;

namespace Slotly.Api.IntegrationTests;

public sealed class BookingEndpointTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task BookingLifecycleAndAvailabilityEndpointsWorkEndToEnd()
    {
        var setup = await CreateSchedulingSetupAsync();
        var startsAt = setup.BookingDate.ToDateTime(new TimeOnly(10, 0), DateTimeKind.Utc);

        var availability = await GetAsync<AvailabilityDto[]>(
            $"/api/v1/availability?serviceId={setup.Service.Id}&staffId={setup.Staff.Id}&startsOn={setup.BookingDate:yyyy-MM-dd}&endsOn={setup.BookingDate:yyyy-MM-dd}",
            setup.Auth);
        availability.Should().Contain(slot => slot.StartsAt == new DateTimeOffset(startsAt));

        var booking = await CreateBookingAsync(setup, startsAt, "lifecycle@customer.example");
        (await GetAsync<BookingDto>($"/api/v1/bookings/{booking.Id}", setup.Auth)).Id.Should().Be(booking.Id);
        (await GetAsync<PagedResponse<BookingDto>>(
                $"/api/v1/bookings?staffId={setup.Staff.Id}&status=Confirmed&page=1&pageSize=10",
                setup.Auth))
            .Items.Should().ContainSingle(item => item.Id == booking.Id);

        var rescheduled = await PostAsync<RescheduleBookingRequest, BookingDto>(
            $"/api/v1/bookings/{booking.Id}/reschedule",
            new RescheduleBookingRequest(booking.Version, new DateTimeOffset(startsAt.AddHours(1))),
            setup.Auth,
            HttpStatusCode.OK);
        rescheduled.StartsAt.Should().Be(new DateTimeOffset(startsAt.AddHours(1)));

        var cancelled = await PostAsync<CancelBookingRequest, BookingDto>(
            $"/api/v1/bookings/{booking.Id}/cancel",
            new CancelBookingRequest(rescheduled.Version, "Customer changed plans"),
            setup.Auth,
            HttpStatusCode.OK);
        cancelled.Status.Should().Be(BookingStatus.Cancelled);

        var completedBooking = await CreateBookingAsync(
            setup,
            startsAt.AddHours(3),
            "completed@customer.example");
        var completed = await PostAsync<BookingStateRequest, BookingDto>(
            $"/api/v1/bookings/{completedBooking.Id}/complete",
            new BookingStateRequest(completedBooking.Version),
            setup.Auth,
            HttpStatusCode.OK);
        completed.Status.Should().Be(BookingStatus.Completed);

        var noShowBooking = await CreateBookingAsync(
            setup,
            startsAt.AddHours(5),
            "noshow@customer.example");
        var noShow = await PostAsync<BookingStateRequest, BookingDto>(
            $"/api/v1/bookings/{noShowBooking.Id}/no-show",
            new BookingStateRequest(noShowBooking.Version),
            setup.Auth,
            HttpStatusCode.OK);
        noShow.Status.Should().Be(BookingStatus.NoShow);
    }

    [Fact]
    public async Task CancellationWindowIsEnforced()
    {
        var setup = await CreateSchedulingSetupAsync();
        var startsAt = new DateTimeOffset(
            setup.BookingDate.ToDateTime(new TimeOnly(10, 0), DateTimeKind.Utc));
        var booking = await CreateBookingAsync(setup, startsAt.UtcDateTime, "window@customer.example");

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<SlotlyDbContext>();
            var tenant = await dbContext.Tenants.SingleAsync(candidate => candidate.Id == setup.Auth.TenantId);
            tenant.ConfigureBookingPolicy("UTC", 2160);
            await dbContext.SaveChangesAsync();
        }

        using var request = AuthorizedRequest(
            HttpMethod.Post,
            $"/api/v1/bookings/{booking.Id}/cancel",
            setup.Auth,
            new CancelBookingRequest(booking.Version, "Too late"));
        using var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task ParallelRequestsProduceExactlyOneBookingForEachSlot()
    {
        var setup = await CreateSchedulingSetupAsync();

        for (var round = 0; round < 3; round++)
        {
            var date = setup.BookingDate.AddDays(round * 7);
            var startsAt = new DateTimeOffset(date.ToDateTime(new TimeOnly(15, 0), DateTimeKind.Utc));
            var requests = Enumerable.Range(0, 12)
                .Select(index => SendCreateBookingAsync(
                    setup,
                    startsAt,
                    $"parallel-{round}-{index}@customer.example"))
                .ToArray();

            var responses = await Task.WhenAll(requests);
            var statusSummary = string.Join(
                ", ",
                responses.GroupBy(status => status)
                    .Select(group => $"{group.Key}={group.Count()}"));

            responses.Count(response => response == HttpStatusCode.Created).Should().Be(1, statusSummary);
            responses.Count(response => response == HttpStatusCode.Conflict).Should().Be(11, statusSummary);
        }
    }

    [Fact]
    public async Task CreatingBookingInvalidatesCachedAvailability()
    {
        var setup = await CreateSchedulingSetupAsync();
        var url = $"/api/v1/availability?serviceId={setup.Service.Id}&staffId={setup.Staff.Id}&startsOn={setup.BookingDate:yyyy-MM-dd}&endsOn={setup.BookingDate:yyyy-MM-dd}";
        var before = await GetAsync<AvailabilityDto[]>(url, setup.Auth);
        var selected = before.First();

        await CreateBookingAsync(setup, selected.StartsAt.UtcDateTime, "cache@customer.example");
        var after = await GetAsync<AvailabilityDto[]>(url, setup.Auth);

        after.Should().NotContain(slot => slot.StartsAt == selected.StartsAt);
    }

    private async Task<SchedulingSetup> CreateSchedulingSetupAsync()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var slug = $"booking-{suffix}";
        var register = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand(
                "Booking Clinic",
                slug,
                $"owner@{slug}.example",
                "Booking Owner",
                "P@ssword123!"));
        register.StatusCode.Should().Be(HttpStatusCode.Created);
        var authResponse = (await register.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
        var auth = new TestAuth(authResponse.AccessToken, authResponse.User.TenantId);

        var service = await PostAsync<ServiceRequest, ServiceDto>(
            "/api/v1/services",
            new ServiceRequest("Consultation", 30, 300, "MAD", 15),
            auth,
            HttpStatusCode.Created);
        var staff = await PostAsync<StaffRequest, StaffDto>(
            "/api/v1/staff",
            new StaffRequest("Booking Specialist", $"specialist@{slug}.example", null),
            auth,
            HttpStatusCode.Created);

        var bookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        await PostAsync<WorkingHoursRequest, WorkingHoursDto>(
            $"/api/v1/staff/{staff.Id}/working-hours",
            new WorkingHoursRequest(
                bookingDate.DayOfWeek,
                new TimeOnly(8, 0),
                new TimeOnly(18, 0),
                [new WorkingHoursBreakRequest(new TimeOnly(12, 0), new TimeOnly(13, 0))]),
            auth,
            HttpStatusCode.Created);
        return new SchedulingSetup(auth, service, staff, bookingDate);
    }

    private Task<BookingDto> CreateBookingAsync(SchedulingSetup setup, DateTime startsAt, string customerEmail)
        => PostAsync<CreateBookingRequest, BookingDto>(
            "/api/v1/bookings",
            new CreateBookingRequest(
                setup.Service.Id,
                setup.Staff.Id,
                new DateTimeOffset(startsAt),
                null,
                "Booking Customer",
                customerEmail,
                "+212600000000"),
            setup.Auth,
            HttpStatusCode.Created);

    private async Task<HttpStatusCode> SendCreateBookingAsync(
        SchedulingSetup setup,
        DateTimeOffset startsAt,
        string customerEmail)
    {
        using var request = AuthorizedRequest(
            HttpMethod.Post,
            "/api/v1/bookings",
            setup.Auth,
            new CreateBookingRequest(
                setup.Service.Id,
                setup.Staff.Id,
                startsAt,
                null,
                "Parallel Customer",
                customerEmail,
                null));
        using var response = await _client.SendAsync(request);
        return response.StatusCode;
    }

    private async Task<TResponse> PostAsync<TRequest, TResponse>(
        string url,
        TRequest body,
        TestAuth auth,
        HttpStatusCode expectedStatus)
    {
        using var request = AuthorizedRequest(HttpMethod.Post, url, auth, body);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(expectedStatus, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions))!;
    }

    private async Task<TResponse> GetAsync<TResponse>(string url, TestAuth auth)
    {
        using var request = AuthorizedRequest<object?>(HttpMethod.Get, url, auth, null);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions))!;
    }

    private static HttpRequestMessage AuthorizedRequest<T>(HttpMethod method, string url, TestAuth auth, T? body)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        request.Headers.Add("X-Tenant-Id", auth.TenantId.ToString());
        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return request;
    }

    private sealed record TestAuth(string AccessToken, Guid TenantId);

    private sealed record SchedulingSetup(
        TestAuth Auth,
        ServiceDto Service,
        StaffDto Staff,
        DateOnly BookingDate);
}
