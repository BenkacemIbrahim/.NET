using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Slotly.Application.Common.Interfaces;
using Slotly.Domain.Users;
using Slotly.Infrastructure.Authentication;
using Slotly.Infrastructure.Persistence;
using Slotly.Infrastructure.Tenancy;

namespace Slotly.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SlotlyDatabase")
            ?? throw new InvalidOperationException(
                "Connection string 'SlotlyDatabase' is not configured.");

        services.AddSingleton<TimeProvider>(TimeProvider.System);
        services.AddScoped<TenantContext>();
        services.AddScoped<ITenantContext>(provider => provider.GetRequiredService<TenantContext>());
        services.AddDbContext<SlotlyDbContext>(options => options
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention());

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.PlatformAdminOnly, policy =>
                policy.RequireRole(UserRole.PlatformAdmin.ToString()));

            options.AddPolicy(AuthorizationPolicies.TenantOwnerOnly, policy =>
                policy.RequireRole(UserRole.TenantOwner.ToString(), UserRole.PlatformAdmin.ToString())
                      .AddRequirements(new MustBelongToActiveTenantRequirement()));

            options.AddPolicy(AuthorizationPolicies.StaffOnly, policy =>
                policy.RequireRole(UserRole.Staff.ToString(), UserRole.TenantOwner.ToString(), UserRole.PlatformAdmin.ToString())
                      .AddRequirements(new MustBelongToActiveTenantRequirement()));

            options.AddPolicy(AuthorizationPolicies.CustomerOnly, policy =>
                policy.RequireRole(UserRole.Customer.ToString(), UserRole.Staff.ToString(), UserRole.TenantOwner.ToString(), UserRole.PlatformAdmin.ToString())
                      .AddRequirements(new MustBelongToActiveTenantRequirement()));

            options.AddPolicy(AuthorizationPolicies.ActiveTenantOnly, policy =>
                policy.AddRequirements(new MustBelongToActiveTenantRequirement()));
        });

        services.AddHttpContextAccessor();
        services.AddScoped<IAuthorizationHandler, TenantAuthorizationHandler>();
        services.AddSingleton<IPasswordHasher, PasswordHasherService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}
