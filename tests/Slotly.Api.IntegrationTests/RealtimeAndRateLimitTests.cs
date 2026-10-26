using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.Mvc;
using Slotly.Api.Realtime;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Models;
using Slotly.Application.Bookings;
using Slotly.Application.Management;

namespace Slotly.Api.IntegrationTests;

public sealed class RealtimeIntegrationTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task TwoSubscribedClientsReceiveOneBookingUpdate()
    {
        var setup = await CreateSetupAsync();
        await using var first = CreateHubConnection(setup.Auth.AccessToken);
        await using var second = CreateHubConnection(setup.Auth.AccessToken);
        var firstUpdate = new TaskCompletionSource<SlotChangedMessage>(TaskCreationOptions.RunContinuationsAsynchronously);
        var secondUpdate = new TaskCompletionSource<SlotChangedMessage>(TaskCreationOptions.RunContinuationsAsynchronously);
        first.On<SlotChangedMessage>("SlotChanged", message => firstUpdate.TrySetResult(message));
        second.On<SlotChangedMessage>("SlotChanged", message => secondUpdate.TrySetResult(message));
        await Task.WhenAll(first.StartAsync(), second.StartAsync());
        await Task.WhenAll(
            first.InvokeAsync("Subscribe", setup.Service.Id, setup.Date),
            second.InvokeAsync("Subscribe", setup.Service.Id, setup.Date));

        using var bookingRequest = AuthorizedRequest(
            HttpMethod.Post,
            "/api/v1/bookings",
            setup.Auth,
            new CreateBookingRequest(
                setup.Service.Id,
                setup.Staff.Id,
                new DateTimeOffset(setup.Date.ToDateTime(new TimeOnly(10, 0), DateTimeKind.Utc)),
                null,
                "Realtime Customer",
                $"realtime-{Guid.NewGuid():N}@example.com",
                null));
        using var bookingResponse = await _client.SendAsync(bookingRequest);
        bookingResponse.StatusCode.Should().Be(HttpStatusCode.Created, await bookingResponse.Content.ReadAsStringAsync());

        var updates = await Task.WhenAll(
            firstUpdate.Task.WaitAsync(TimeSpan.FromSeconds(10)),
            secondUpdate.Task.WaitAsync(TimeSpan.FromSeconds(10)));
        updates.Should().AllSatisfy(update =>
        {
            update.ServiceId.Should().Be(setup.Service.Id);
            update.Change.Should().Be("Created");
        });
    }

    private HubConnection CreateHubConnection(string accessToken)
        => new HubConnectionBuilder()
            .WithUrl("http://localhost/hubs/availability", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult<string?>(accessToken);
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
            })
            .Build();

    private async Task<RealtimeSetup> CreateSetupAsync()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var register = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand("Realtime Clinic", $"realtime-{suffix}", $"owner@{suffix}.example", "Owner", "P@ssword123!"));
        var body = (await register.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
        var auth = new TestAuth(body.AccessToken, body.User.TenantId);
        var service = await PostAsync<ServiceRequest, ServiceDto>(
            "/api/v1/services", new ServiceRequest("Realtime service", 30, 100, "EUR", 0), auth);
        var staff = await PostAsync<StaffRequest, StaffDto>(
            "/api/v1/staff", new StaffRequest("Realtime Staff", $"staff@{suffix}.example", null), auth);
        var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        await PostAsync<WorkingHoursRequest, WorkingHoursDto>(
            $"/api/v1/staff/{staff.Id}/working-hours",
            new WorkingHoursRequest(date.DayOfWeek, new TimeOnly(8, 0), new TimeOnly(18, 0), []), auth);
        return new RealtimeSetup(auth, service, staff, date);
    }

    private async Task<TResponse> PostAsync<TRequest, TResponse>(string url, TRequest body, TestAuth auth)
    {
        using var request = AuthorizedRequest(HttpMethod.Post, url, auth, body);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions))!;
    }

    private static HttpRequestMessage AuthorizedRequest<T>(HttpMethod method, string url, TestAuth auth, T body)
    {
        var request = new HttpRequestMessage(method, url) { Content = JsonContent.Create(body) };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        request.Headers.Add("X-Tenant-Id", auth.TenantId.ToString());
        return request;
    }

    private sealed record TestAuth(string AccessToken, Guid TenantId);
    private sealed record RealtimeSetup(TestAuth Auth, ServiceDto Service, StaffDto Staff, DateOnly Date);
}

public sealed class RateLimitIntegrationTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task AuthLimitReturnsProblemDetails()
    {
        var responses = new List<HttpResponseMessage>();
        try
        {
            for (var index = 0; index < 31; index++)
            {
                responses.Add(await _client.PostAsync(
                    "/api/v1/auth/login",
                    new StringContent("{", System.Text.Encoding.UTF8, "application/json")));
            }

            responses.Last().StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
            responses.Last().Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
            var problem = await responses.Last().Content.ReadFromJsonAsync<ProblemDetails>();
            problem!.Title.Should().Be("Too Many Requests");
        }
        finally
        {
            foreach (var response in responses)
            {
                response.Dispose();
            }
        }
    }
}
