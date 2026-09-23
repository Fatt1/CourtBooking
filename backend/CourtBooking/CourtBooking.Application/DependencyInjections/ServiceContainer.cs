using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using CourtBooking.Application.Behaviors;

namespace CourtBooking.Application.DependencyInjections;

public static class ServiceContainer
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(ServiceContainer).Assembly;

        // Register MediatR — scans this assembly for all IRequestHandler<,> implementations
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);

            // Pipeline order (outer → inner):
            // 1. LoggingBehaviors.CommandHandler — logs command lifecycle
            // 2. LoggingBehaviors.QueryHandler   — logs query lifecycle
            // 3. ValidationBehavior              — validates before the handler runs
            cfg.AddOpenBehavior(typeof(LoggingBehaviors.CommandHandler<,>));
            cfg.AddOpenBehavior(typeof(LoggingBehaviors.QueryHandler<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        // Register all FluentValidation validators in this assembly
        services.AddValidatorsFromAssembly(assembly, includeInternalTypes: true);

        return services;
    }
}
