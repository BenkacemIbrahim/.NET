using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Slotly.Api.IntegrationTests;

public sealed class SlotlyWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSlotlyTestConfiguration();
        builder.UseSetting(
            "ConnectionStrings:SlotlyDatabase",
            "Host=localhost;Port=1;Database=unused;Username=unused;Password=unused");
    }
}

internal static class TestHostConfiguration
{
    public static IWebHostBuilder UseSlotlyTestConfiguration(this IWebHostBuilder builder)
    {
        builder.UseSetting("AllowedHosts", "*");
        builder.UseSetting("Jwt:SigningKey", "slotly-integration-tests-signing-key-minimum-32-characters!");
        builder.UseSetting("Jwt:Issuer", "slotly-test");
        builder.UseSetting("Jwt:Audience", "slotly-test-clients");
        builder.UseSetting("Jwt:AccessTokenLifetimeMinutes", "15");
        builder.UseSetting("Jwt:RefreshTokenLifetimeDays", "7");
        builder.UseSetting("Smtp:Host", "localhost");
        builder.UseSetting("Smtp:Port", "1025");
        builder.UseSetting("Smtp:UseSsl", "false");
        builder.UseSetting("Smtp:FromAddress", "tests@slotly.local");
        builder.UseSetting("Smtp:FromName", "Slotly Tests");
        builder.UseSetting("BackgroundJobs:PendingBookingExpiryMinutes", "15");
        builder.UseSetting("BackgroundJobs:RetentionDays", "30");
        builder.UseSetting("Stripe:SuccessUrl", "http://localhost/payments/success");
        builder.UseSetting("Stripe:CancelUrl", "http://localhost/payments/cancel");
        builder.UseSetting("Tenancy:BaseDomain", "slotly.test");
        builder.UseSetting("Tenancy:EnableSubdomainResolution", "true");
        builder.UseSetting("Tenancy:EnableHeaderResolution", "true");
        builder.UseSetting("RateLimiting:AuthPermitLimit", "30");
        builder.UseSetting("RateLimiting:TenantApiPermitLimit", "120");
        builder.UseSetting("RateLimiting:TenantWriteTokenLimit", "80");
        builder.UseSetting("Hangfire:WorkerCount", "2");
        builder.UseSetting("Hangfire:SchemaName", "hangfire");
        builder.UseSetting("Database:AutoMigrateAndSeed", "false");
        builder.UseSetting("Swagger:Enabled", "false");
        return builder;
    }
}
