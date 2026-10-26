namespace Slotly.Api.Infrastructure;

internal static class EnvironmentConfiguration
{
    private static readonly (string ConfigurationKey, string EnvironmentVariable)[] RequiredValues =
    [
        ("AllowedHosts", "ALLOWED_HOSTS"),
        ("ConnectionStrings:SlotlyDatabase", "DATABASE_CONNECTION_STRING"),
        ("Smtp:Host", "SMTP_HOST"),
        ("Smtp:Port", "SMTP_CONTAINER_PORT"),
        ("Smtp:FromAddress", "SMTP_FROM_ADDRESS"),
        ("Smtp:FromName", "SMTP_FROM_NAME"),
        ("BackgroundJobs:PendingBookingExpiryMinutes", "PENDING_BOOKING_EXPIRY_MINUTES"),
        ("BackgroundJobs:RetentionDays", "BACKGROUND_JOB_RETENTION_DAYS"),
        ("Stripe:SuccessUrl", "STRIPE_SUCCESS_URL"),
        ("Stripe:CancelUrl", "STRIPE_CANCEL_URL"),
        ("Redis:ConnectionString", "REDIS_CONNECTION_STRING"),
        ("Seq:Url", "SEQ_URL"),
        ("Serilog:MinimumLevel:Default", "LOG_LEVEL"),
        ("Jwt:SigningKey", "JWT_SIGNING_KEY"),
        ("Jwt:Issuer", "JWT_ISSUER"),
        ("Jwt:Audience", "JWT_AUDIENCE"),
        ("Jwt:AccessTokenLifetimeMinutes", "JWT_ACCESS_TOKEN_LIFETIME_MINUTES"),
        ("Jwt:RefreshTokenLifetimeDays", "JWT_REFRESH_TOKEN_LIFETIME_DAYS"),
        ("Tenancy:BaseDomain", "TENANCY_BASE_DOMAIN"),
        ("Tenancy:EnableSubdomainResolution", "TENANCY_ENABLE_SUBDOMAIN_RESOLUTION"),
        ("Tenancy:EnableHeaderResolution", "TENANCY_ENABLE_HEADER_RESOLUTION"),
        ("RateLimiting:AuthPermitLimit", "RATE_LIMIT_AUTH"),
        ("RateLimiting:TenantApiPermitLimit", "RATE_LIMIT_TENANT_API"),
        ("RateLimiting:TenantWriteTokenLimit", "RATE_LIMIT_TENANT_WRITE"),
        ("Hangfire:WorkerCount", "HANGFIRE_WORKER_COUNT"),
        ("Hangfire:SchemaName", "HANGFIRE_SCHEMA"),
        ("Database:AutoMigrateAndSeed", "DATABASE_AUTO_MIGRATE_AND_SEED"),
        ("Swagger:Enabled", "SWAGGER_ENABLED"),
        ("PublicUrls:Api", "PUBLIC_API_URL"),
        ("PublicUrls:Web", "PUBLIC_WEB_URL"),
        ("Cors:AllowedOrigins:0", "CORS_ORIGIN_1"),
    ];

    public static void Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        if (environment.IsEnvironment("Testing"))
        {
            return;
        }

        var missing = RequiredValues
            .Where(value => string.IsNullOrWhiteSpace(configuration[value.ConfigurationKey]))
            .Select(value => value.EnvironmentVariable)
            .ToArray();

        if (missing.Length > 0)
        {
            throw new InvalidOperationException(
                $"Missing required environment variable(s): {string.Join(", ", missing)}. " +
                "Create the local .env files with scripts/initialize-environment.ps1 before starting Slotly.");
        }

        if (configuration["Jwt:SigningKey"]!.Length < 32)
        {
            throw new InvalidOperationException(
                "Environment variable JWT_SIGNING_KEY must contain at least 32 characters.");
        }
    }
}
