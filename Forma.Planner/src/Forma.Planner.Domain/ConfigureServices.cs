using System.Diagnostics.CodeAnalysis;
using Forma.Domain.Builders;
using Forma.Domain.Builders.Contracts;
using Microsoft.Extensions.DependencyInjection;


namespace Forma.Domain;

[ExcludeFromCodeCoverage]
public static class ConfigureServices
{
    /// <summary>
    /// Adds Entities Builders the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    public static IServiceCollection AddEntitiesBuilders(this IServiceCollection services) =>
        services
            .AddScoped<IWorkoutBuilder, WorkoutBuilder>()
            .AddScoped<IRoutineBuilder, RoutineBuilder>();
}