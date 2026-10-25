using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Slotly.Application.Bookings;

namespace Slotly.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddSingleton<IAvailabilityEngine, AvailabilityEngine>();
        return services;
    }
}
