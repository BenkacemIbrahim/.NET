using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Slotly.Application.Authentication.Commands;
using Slotly.Application.Authentication.Models;
using Slotly.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace Slotly.Api.IntegrationTests;

public sealed class AuthTestWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("slotly_auth_tests")
        .WithUsername("slotly")
        .WithPassword("slotly_tests_password")
        .Build();

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SlotlyDbContext>();
        await db.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await _database.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:SlotlyDatabase", _database.GetConnectionString());
        builder.UseSetting("Jwt:SigningKey", "integration-tests-super-secret-signing-key-minimum-32-chars!");
        builder.UseSetting("Jwt:Issuer", "slotly-test");
        builder.UseSetting("Jwt:Audience", "slotly-test-clients");
        builder.UseSetting("Stripe:WebhookSecret", "whsec_slotly_integration_tests");
    }
}

public sealed class AuthIntegrationTests(AuthTestWebApplicationFactory factory)
    : IClassFixture<AuthTestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task FullAuthenticationLifecycleFlow()
    {
        // 1. Register Tenant
        var registerCommand = new RegisterTenantCommand(
            "Acme Clinic",
            "acme-clinic",
            "owner@acme.example",
            "Acme Owner",
            "P@ssword123!");

        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register-tenant", registerCommand);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var auth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        auth.Should().NotBeNull();
        auth!.AccessToken.Should().NotBeNullOrWhiteSpace();
        auth.RefreshToken.Should().NotBeNullOrWhiteSpace();
        auth.User.Role.Should().Be("TenantOwner");
        auth.User.Email.Should().Be("owner@acme.example");

        var tenantId = auth.User.TenantId;

        // 2. Get Current User (/me)
        using var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        meRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        var meResponse = await _client.SendAsync(meRequest);
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var meUser = await meResponse.Content.ReadFromJsonAsync<UserDto>(JsonOptions);
        meUser.Should().NotBeNull();
        meUser!.Email.Should().Be("owner@acme.example");
        meUser.TenantId.Should().Be(tenantId);

        // 3. Login
        var loginCommand = new LoginCommand("owner@acme.example", "P@ssword123!", "acme-clinic");
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", loginCommand);
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        loginAuth.Should().NotBeNull();
        loginAuth!.AccessToken.Should().NotBeNullOrWhiteSpace();
        loginAuth.RefreshToken.Should().NotBeNullOrWhiteSpace();

        // 4. Refresh Token
        var refreshCommand = new RefreshTokenCommand(loginAuth.RefreshToken);
        var refreshResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", refreshCommand);
        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var refreshedAuth = await refreshResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        refreshedAuth.Should().NotBeNull();
        refreshedAuth!.AccessToken.Should().NotBeNullOrWhiteSpace();
        refreshedAuth.RefreshToken.Should().NotBeNullOrWhiteSpace();
        refreshedAuth.RefreshToken.Should().NotBe(loginAuth.RefreshToken);

        // 5. Token Reuse Detection
        // Re-using the old refresh token must trigger reuse detection and revoke the session family
        var reuseResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", refreshCommand);
        reuseResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var reuseProblem = await reuseResponse.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        reuseProblem!.Title.Should().Be("Token reuse detected");

        // The newly issued token should now also be rejected because reuse invalidated the family
        var invalidatedResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/refresh",
            new RefreshTokenCommand(refreshedAuth.RefreshToken));
        invalidatedResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // 6. Login again to continue flow
        var reloginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", loginCommand);
        reloginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var currentAuth = (await reloginResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;

        // 7. Change Password
        var changePasswordCommand = new ChangePasswordCommand("P@ssword123!", "NewP@ssword456!");
        using var changePasswordRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/change-password")
        {
            Content = JsonContent.Create(changePasswordCommand),
        };
        changePasswordRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", currentAuth.AccessToken);

        var changePasswordResponse = await _client.SendAsync(changePasswordRequest);
        changePasswordResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Old password must fail
        var failedOldLogin = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginCommand("owner@acme.example", "P@ssword123!", "acme-clinic"));
        failedOldLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        // New password succeeds
        var successfulNewLogin = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginCommand("owner@acme.example", "NewP@ssword456!", "acme-clinic"));
        successfulNewLogin.StatusCode.Should().Be(HttpStatusCode.OK);
        var activeAuth = (await successfulNewLogin.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;

        // 8. Invite Staff Member (Owner can invite staff)
        var inviteCommand = new InviteStaffCommand("staff@acme.example", "Acme Staff", "StaffP@ssword123!");
        using var inviteRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/invite-staff")
        {
            Content = JsonContent.Create(inviteCommand),
        };
        inviteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", activeAuth.AccessToken);
        inviteRequest.Headers.Add("X-Tenant-Id", tenantId.ToString());

        var inviteResponse = await _client.SendAsync(inviteRequest);
        inviteResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var staffUser = await inviteResponse.Content.ReadFromJsonAsync<UserDto>(JsonOptions);
        staffUser.Should().NotBeNull();
        staffUser!.Role.Should().Be("Staff");
        staffUser.Email.Should().Be("staff@acme.example");

        // Staff can log in
        var staffLoginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginCommand("staff@acme.example", "StaffP@ssword123!", "acme-clinic"));
        staffLoginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var staffAuth = (await staffLoginResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;
        staffAuth.User.Role.Should().Be("Staff");

        // 9. Logout
        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout")
        {
            Content = JsonContent.Create(new RefreshTokenCommand(staffAuth.RefreshToken)),
        };
        logoutRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", staffAuth.AccessToken);

        var logoutResponse = await _client.SendAsync(logoutRequest);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Refresh with logged-out token fails
        var refreshAfterLogout = await _client.PostAsJsonAsync(
            "/api/v1/auth/refresh",
            new RefreshTokenCommand(staffAuth.RefreshToken));
        refreshAfterLogout.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task StaffCannotInviteOtherStaff()
    {
        // Register tenant
        var registerResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand("Role Test Clinic", "role-clinic", "owner@role.example", "Owner", "P@ssword123!"));
        var auth = (await registerResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;

        // Invite staff member as owner
        using var inviteRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/invite-staff")
        {
            Content = JsonContent.Create(new InviteStaffCommand("staff1@role.example", "Staff 1", "StaffP@ssword123!")),
        };
        inviteRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        inviteRequest.Headers.Add("X-Tenant-Id", auth.User.TenantId.ToString());
        await _client.SendAsync(inviteRequest);

        // Staff member logs in
        var staffLoginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginCommand("staff1@role.example", "StaffP@ssword123!", "role-clinic"));
        var staffAuth = (await staffLoginResponse.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;

        // Staff member attempts to invite another staff member -> Forbidden (403)
        using var forbiddenInvite = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/invite-staff")
        {
            Content = JsonContent.Create(new InviteStaffCommand("staff2@role.example", "Staff 2", "StaffP@ssword123!")),
        };
        forbiddenInvite.Headers.Authorization = new AuthenticationHeaderValue("Bearer", staffAuth.AccessToken);
        forbiddenInvite.Headers.Add("X-Tenant-Id", auth.User.TenantId.ToString());

        var forbiddenResponse = await _client.SendAsync(forbiddenInvite);
        forbiddenResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task TenantMismatchIsRejectedWithForbidden()
    {
        // Register Tenant A
        var regA = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand("Clinic A", "clinic-a", "owner@a.example", "Owner A", "P@ssword123!"));
        var authA = (await regA.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;

        // Register Tenant B
        var regB = await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand("Clinic B", "clinic-b", "owner@b.example", "Owner B", "P@ssword123!"));
        var authB = (await regB.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions))!;

        // User A sends request targeting Tenant B via X-Tenant header
        using var mismatchRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        mismatchRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authA.AccessToken);
        mismatchRequest.Headers.Add("X-Tenant-Id", authB.User.TenantId.ToString());

        var mismatchResponse = await _client.SendAsync(mismatchRequest);

        mismatchResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var problem = await mismatchResponse.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Title.Should().Be("Tenant Access Forbidden");
    }

    [Fact]
    public async Task MultipleFailedLoginsTriggerLockout()
    {
        var slug = $"lockout-{Guid.NewGuid():N}"[..20];
        var email = $"locked@{slug}.example";

        await _client.PostAsJsonAsync(
            "/api/v1/auth/register-tenant",
            new RegisterTenantCommand("Lockout Clinic", slug, email, "Lockout Owner", "P@ssword123!"));

        // Send 5 failed login attempts
        for (var i = 0; i < 4; i++)
        {
            var failed = await _client.PostAsJsonAsync(
                "/api/v1/auth/login",
                new LoginCommand(email, "WrongPassword!", slug));
            failed.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        // 5th attempt triggers lockout
        var lockedAttempt = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginCommand(email, "WrongPassword!", slug));
        lockedAttempt.StatusCode.Should().Be(HttpStatusCode.Locked);

        var lockedProblem = await lockedAttempt.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        lockedProblem!.Title.Should().Be("Account locked");

        // Even with correct password, login is blocked while locked out
        var blockedWithCorrectPassword = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginCommand(email, "P@ssword123!", slug));
        blockedWithCorrectPassword.StatusCode.Should().Be(HttpStatusCode.Locked);
    }
}
