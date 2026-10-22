using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Slotly.Infrastructure.Persistence;

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

        services.AddDbContext<SlotlyDbContext>(options =>
            options.UseNpgsql(connectionString));

        return services;
    }
}
