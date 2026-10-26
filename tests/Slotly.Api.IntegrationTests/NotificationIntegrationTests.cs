using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Models;
using Slotly.Application.Bookings;
using Slotly.Application.Management;
using Slotly.Infrastructure.Jobs;
using Slotly.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace Slotly.Api.IntegrationTests;

public sealed class NotificationTestWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("slotly_notification_tests")
        .WithUsername("slotly")
        .WithPassword("slotly_tests_password")
        .Build();
    private readonly IContainer _mailpit = new ContainerBuilder("axllent/mailpit:v1.27.8")
        .WithPortBinding(1025, true)
        .WithPortBinding(8025, true)
        .WithWaitStrategy(Wait.ForUnixContainer().UntilInternalTcpPortIsAvailable(1025))
        .Build();

    public Uri MailpitApi => new($"http://localhost:{_mailpit.GetMappedPublicPort(8025)}");

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_database.StartAsync(), _mailpit.StartAsync());
        using var scope = Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<SlotlyDbContext>().Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await Task.WhenAll(_database.DisposeAsync().AsTask(), _mailpit.DisposeAsync().AsTask());
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSlotlyTestConfiguration();
        builder.UseSetting("ConnectionStrings:SlotlyDatabase", _database.GetConnectionString());
        builder.UseSetting("Jwt:SigningKey", "notification-tests-signing-key-minimum-32-characters!");
        builder.UseSetting("Jwt:Issuer", "slotly-test");
        builder.UseSetting("Jwt:Audience", "slotly-test-clients");
        builder.UseSetting("Smtp:Host", "localhost");
        builder.UseSetting("Smtp:Port", _mailpit.GetMappedPublicPort(1025).ToString(CultureInfo.InvariantCulture));
        builder.UseSetting("Smtp:UseSsl", "false");
    }
}

public sealed class NotificationIntegrationTests(NotificationTestWebApplicationFactory factory)
    : IClassFixture<NotificationTestWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreatingBookingSendsOneEmailAndRetryDoesNotDuplicateIt()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var auth = await RegisterAsync(suffix);
        var service = await PostAsync<ServiceRequest, ServiceDto>(
            "/api/v1/services",
            new ServiceRequest("Sports massage", 30, 450, "MAD", 15),
            auth);
        var staff = await PostAsync<StaffRequest, StaffDto>(
            "/api/v1/staff",
            new StaffRequest("Nadia Therapist", $"nadia@{suffix}.example", null),
            auth);
        var bookingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        await PostAsync<WorkingHoursRequest, WorkingHoursDto>(
            $"/api/v1/staff/{staff.Id}/working-hours",
            new WorkingHoursRequest(bookingDate.DayOfWeek, new TimeOnly(8, 0), new TimeOnly(18, 0), []),
            auth);

        using var availabilityRequest = AuthorizedRequest<object?>(
            HttpMethod.Get,
            $"/api/v1/availability?serviceId={service.Id}&staffId={staff.Id}&startsOn={bookingDate:yyyy-MM-dd}&endsOn={bookingDate:yyyy-MM-dd}",
            auth,
            null);
        using var availabilityResponse = await _client.SendAsync(availabilityRequest);
        availabilityResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var startsAt = (await availabilityResponse.Content.ReadFromJsonAsync<AvailabilityDto[]>(JsonOptions))!
            .First().StartsAt;

        using var request = AuthorizedRequest(
            HttpMethod.Post,
            "/api/v1/bookings",
            auth,
            new CreateBookingRequest(
                service.Id,
                staff.Id,
                startsAt,
                null,
                "Yasmine Customer",
                $"yasmine@{suffix}.example",
                "+212600000000"));
        request.Headers.Add("X-Correlation-ID", $"notification-test-{suffix}");
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());

        await ProcessOutboxAsync();
        await ProcessOutboxAsync();

        using var mailpitClient = new HttpClient { BaseAddress = factory.MailpitApi };
        using var messagesResponse = await mailpitClient.GetAsync("/api/v1/messages");
        messagesResponse.EnsureSuccessStatusCode();
        using var messages = JsonDocument.Parse(await messagesResponse.Content.ReadAsStringAsync());
        var items = messages.RootElement.GetProperty("messages").EnumerateArray().ToArray();
        items.Should().ContainSingle();
        items[0].GetProperty("Subject").GetString().Should().Be("Booking confirmed");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SlotlyDbContext>();
        (await dbContext.NotificationDeliveries.CountAsync()).Should().Be(1);
        (await dbContext.OutboxMessages.SingleAsync()).CorrelationId.Should().Be($"notification-test-{suffix}");
    }

    private async Task<TestAuth> RegisterAsync(string suffix)
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand(
                "Notification Clinic",
                $"notify-{suffix}",
                $"owner@{suffix}.example",
                "Notification Owner",
                "P@ssword123!"));
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = (await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
        return new TestAuth(body.AccessToken, body.User.TenantId);
    }

    private async Task<TResponse> PostAsync<TRequest, TResponse>(string url, TRequest body, TestAuth auth)
    {
        using var request = AuthorizedRequest(HttpMethod.Post, url, auth, body);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions))!;
    }

    private async Task ProcessOutboxAsync()
    {
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<OutboxProcessorJob>()
            .ProcessAsync(CancellationToken.None);
    }

    private static HttpRequestMessage AuthorizedRequest<T>(HttpMethod method, string url, TestAuth auth, T? body)
    {
        var request = new HttpRequestMessage(method, url);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        request.Headers.Add("X-Tenant-Id", auth.TenantId.ToString());
        return request;
    }

    private sealed record TestAuth(string AccessToken, Guid TenantId);
}
