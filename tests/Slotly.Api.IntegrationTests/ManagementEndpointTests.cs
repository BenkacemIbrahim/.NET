using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Models;
using Slotly.Application.Common.Models;
using Slotly.Application.Management;

namespace Slotly.Api.IntegrationTests;

public sealed class ManagementEndpointTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task OwnerCanManageServicesStaffWorkingHoursAndTimeOff()
    {
        var auth = await RegisterOwnerAsync();

        var service = await CreateAsync<ServiceRequest, ServiceDto>(
            "/api/v1/services",
            new ServiceRequest("Initial Consultation", 30, 350, "MAD", 10),
            auth);
        (await GetAsync<ServiceDto>($"/api/v1/services/{service.Id}", auth)).Name
            .Should().Be("Initial Consultation");
        var updatedService = await PutAsync<ServiceRequest, ServiceDto>(
            $"/api/v1/services/{service.Id}",
            new ServiceRequest("Extended Consultation", 45, 450, "MAD", 15),
            auth);
        updatedService.DurationMinutes.Should().Be(45);
        (await GetAsync<PagedResponse<ServiceDto>>("/api/v1/services?page=1&pageSize=10", auth))
            .Items.Should().ContainSingle(item => item.Id == service.Id);

        var staff = await CreateAsync<StaffRequest, StaffDto>(
            "/api/v1/staff",
            new StaffRequest("Sara Therapist", "sara@management.example", null),
            auth);
        (await GetAsync<StaffDto>($"/api/v1/staff/{staff.Id}", auth)).Email
            .Should().Be("sara@management.example");
        var updatedStaff = await PutAsync<StaffRequest, StaffDto>(
            $"/api/v1/staff/{staff.Id}",
            new StaffRequest("Sara Senior Therapist", "sara.senior@management.example", null),
            auth);
        updatedStaff.DisplayName.Should().Be("Sara Senior Therapist");
        (await GetAsync<PagedResponse<StaffDto>>("/api/v1/staff?page=1&pageSize=10", auth))
            .Items.Should().Contain(item => item.Id == staff.Id);

        var hoursRequest = new WorkingHoursRequest(
            DayOfWeek.Monday,
            new TimeOnly(9, 0),
            new TimeOnly(17, 0),
            [new WorkingHoursBreakRequest(new TimeOnly(12, 0), new TimeOnly(13, 0))]);
        var hours = await CreateAsync<WorkingHoursRequest, WorkingHoursDto>(
            $"/api/v1/staff/{staff.Id}/working-hours",
            hoursRequest,
            auth);
        (await GetAsync<WorkingHoursDto[]>($"/api/v1/staff/{staff.Id}/working-hours", auth))
            .Should().ContainSingle(item => item.Id == hours.Id);
        var updatedHours = await PutAsync<WorkingHoursRequest, WorkingHoursDto>(
            $"/api/v1/staff/{staff.Id}/working-hours/{hours.Id}",
            hoursRequest with
            {
                EndsAt = new TimeOnly(18, 0),
                Breaks = [new WorkingHoursBreakRequest(new TimeOnly(12, 30), new TimeOnly(13, 15))],
            },
            auth);
        updatedHours.EndsAt.Should().Be(new TimeOnly(18, 0));

        var timeOff = await CreateAsync<TimeOffRequest, TimeOffDto>(
            $"/api/v1/staff/{staff.Id}/time-off",
            new TimeOffRequest(
                new DateTimeOffset(2027, 1, 4, 9, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2027, 1, 4, 12, 0, 0, TimeSpan.Zero),
                "Medical appointment"),
            auth);
        (await GetAsync<TimeOffDto>($"/api/v1/staff/{staff.Id}/time-off/{timeOff.Id}", auth))
            .Reason.Should().Be("Medical appointment");
        (await GetAsync<PagedResponse<TimeOffDto>>(
                $"/api/v1/staff/{staff.Id}/time-off?page=1&pageSize=10",
                auth))
            .Items.Should().ContainSingle(item => item.Id == timeOff.Id);
        var updatedTimeOff = await PutAsync<TimeOffRequest, TimeOffDto>(
            $"/api/v1/staff/{staff.Id}/time-off/{timeOff.Id}",
            new TimeOffRequest(
                new DateTimeOffset(2027, 1, 4, 10, 0, 0, TimeSpan.Zero),
                new DateTimeOffset(2027, 1, 4, 13, 0, 0, TimeSpan.Zero),
                "Updated appointment"),
            auth);
        updatedTimeOff.Reason.Should().Be("Updated appointment");

        (await DeleteAsync($"/api/v1/staff/{staff.Id}/time-off/{timeOff.Id}", auth))
            .Should().Be(HttpStatusCode.NoContent);
        (await DeleteAsync($"/api/v1/staff/{staff.Id}/working-hours/{hours.Id}", auth))
            .Should().Be(HttpStatusCode.NoContent);
        (await DeleteAsync($"/api/v1/staff/{staff.Id}", auth)).Should().Be(HttpStatusCode.NoContent);
        (await DeleteAsync($"/api/v1/services/{service.Id}", auth)).Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task StaffRoleCannotMutateTenantManagementResources()
    {
        var owner = await RegisterOwnerAsync();
        using var invite = AuthorizedRequest(
            HttpMethod.Post,
            "/api/v1/auth/invite-staff",
            owner,
            new InviteStaffCommand("staff@authorization.example", "Staff User", "StaffP@ssword123!"));
        (await _client.SendAsync(invite)).EnsureSuccessStatusCode();

        var login = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginCommand("staff@authorization.example", "StaffP@ssword123!", owner.TenantSlug));
        var staffAuthResponse = (await login.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
        var staff = new TestAuth(staffAuthResponse.AccessToken, owner.TenantId, owner.TenantSlug);
        using var create = AuthorizedRequest(
            HttpMethod.Post,
            "/api/v1/services",
            staff,
            new ServiceRequest("Forbidden", 30, 100, "MAD", 0));

        var response = await _client.SendAsync(create);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<TestAuth> RegisterOwnerAsync()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var slug = $"manage-{suffix}";
        var response = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand(
                "Management Clinic",
                slug,
                $"owner@{slug}.example",
                "Management Owner",
                "P@ssword123!"));
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
        return new TestAuth(auth.AccessToken, auth.User.TenantId, slug);
    }

    private async Task<TResponse> CreateAsync<TRequest, TResponse>(
        string url,
        TRequest body,
        TestAuth auth)
    {
        using var request = AuthorizedRequest(HttpMethod.Post, url, auth, body);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions))!;
    }

    private async Task<TResponse> PutAsync<TRequest, TResponse>(string url, TRequest body, TestAuth auth)
    {
        using var request = AuthorizedRequest(HttpMethod.Put, url, auth, body);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions))!;
    }

    private async Task<TResponse> GetAsync<TResponse>(string url, TestAuth auth)
    {
        using var request = AuthorizedRequest<object?>(HttpMethod.Get, url, auth, null);
        using var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        return (await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions))!;
    }

    private async Task<HttpStatusCode> DeleteAsync(string url, TestAuth auth)
    {
        using var request = AuthorizedRequest<object?>(HttpMethod.Delete, url, auth, null);
        using var response = await _client.SendAsync(request);
        return response.StatusCode;
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

    private sealed record TestAuth(string AccessToken, Guid TenantId, string TenantSlug);
}
