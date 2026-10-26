using System.Threading.RateLimiting;
using System.Globalization;
using Asp.Versioning;
using Microsoft.OpenApi;
using Hangfire;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;

using Slotly.Api.Endpoints;
using Slotly.Api.Infrastructure;
using Slotly.Application;
using Slotly.Infrastructure;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Jobs;
using Slotly.Api.Realtime;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 1_048_576);

builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration.ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext();
    var seqUrl = context.Configuration["Seq:Url"];
    if (!string.IsNullOrWhiteSpace(seqUrl))
    {
        configuration.WriteTo.Seq(seqUrl, formatProvider: CultureInfo.InvariantCulture);
    }
});

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddCheck<PostgreSqlHealthCheck>("postgresql", tags: ["ready"])
    .AddCheck<HangfireHealthCheck>("hangfire", tags: ["ready"])
    .AddCheck<SmtpHealthCheck>("smtp", tags: ["ready"]);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR(options => options.EnableDetailedErrors = builder.Environment.IsEnvironment("Testing"));
builder.Services.AddSingleton<BookingChangePublisher>();
builder.Services.AddHybridCache();
builder.Services.AddSingleton<AvailabilityCache>();
builder.Services.AddSingleton<TenantSettingsCache>();
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy("SlotlyClients", policy =>
{
    if (allowedOrigins.Length > 0)
    {
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    }
}));
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddOpenTelemetry()
        .ConfigureResource(resource => resource.AddService("Slotly.Api"))
        .WithTracing(tracing => tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddConsoleExporter())
        .WithMetrics(metrics => metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddConsoleExporter());
}
var redisConnection = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    builder.Services.AddStackExchangeRedisCache(options => options.Configuration = redisConnection);
}

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Slotly API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer access token",
    });

    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        },
    });


});


builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
})
.AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.Configure<TenancyOptions>(builder.Configuration.GetSection(TenancyOptions.SectionName));
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddHangfireServer(options => options.WorkerCount = Math.Max(2, Environment.ProcessorCount));
}

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        await Results.Problem(
            statusCode: StatusCodes.Status429TooManyRequests,
            title: "Too Many Requests",
            detail: "Rate limit exceeded. Please try again later.",
            extensions: new Dictionary<string, object?>
            {
                ["traceId"] = context.HttpContext.TraceIdentifier,
            })
            .ExecuteAsync(context.HttpContext);
    };

    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    options.AddPolicy("tenant-api", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.FindFirst("tenant_id")?.Value
                ?? httpContext.Connection.RemoteIpAddress?.ToString()
                ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));

    options.AddPolicy("tenant-write", httpContext =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: httpContext.User.FindFirst("tenant_id")?.Value
                ?? httpContext.Connection.RemoteIpAddress?.ToString()
                ?? "anonymous",
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 80,
                TokensPerPeriod = 40,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                AutoReplenishment = true,
                QueueLimit = 0,
            }));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await app.Services.InitializeDatabaseAsync();
}

app.UseExceptionHandler();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseSerilogRequestLogging();
app.UseCors("SlotlyClients");
app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseRateLimiter();
app.UseMiddleware<RequestIdentityLogMiddleware>();
app.UseAuthorization();
app.UseMiddleware<AuditLogMiddleware>();

if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = [new PlatformAdminDashboardAuthorizationFilter()],
        DashboardTitle = "Slotly background jobs",
    });

    RecurringJob.AddOrUpdate<OutboxProcessorJob>(
        "outbox-processor",
        job => job.ProcessAsync(CancellationToken.None),
        Cron.Minutely);
    RecurringJob.AddOrUpdate<BookingMaintenanceJobs>(
        "booking-reminders",
        job => job.SendRemindersAsync(CancellationToken.None),
        Cron.Minutely);
    RecurringJob.AddOrUpdate<BookingMaintenanceJobs>(
        "expire-pending-bookings",
        job => job.ExpirePendingBookingsAsync(CancellationToken.None),
        Cron.Minutely);
    RecurringJob.AddOrUpdate<BookingMaintenanceJobs>(
        "cleanup-old-job-data",
        job => job.CleanupAsync(CancellationToken.None),
        Cron.Daily);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Slotly API v1"));
}

app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("live"),
});
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("live"),
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
});
app.MapAuthEndpoints();
app.MapManagementEndpoints();
app.MapBookingEndpoints();
app.MapPaymentEndpoints();
app.MapHub<AvailabilityHub>("/hubs/availability");

app.Run();

public partial class Program;
