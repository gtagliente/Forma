using System.Diagnostics.CodeAnalysis;
using Forma.CoreInfrastructure.Abstractions;


// using Forma.Domain.Entities.CustomerAggregate;
using Forma.Infrastructure.Data;
using Forma.Infrastructure.Data.Context;
using Forma.Infrastructure.Data.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Forma.Infrastructure;

[ExcludeFromCodeCoverage]
public static class ConfigureServices
{
    /// <summary>
    /// Adds the memory cache service to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    public static void AddMemoryCacheService(this IServiceCollection services) =>
        services.AddScoped<ICacheService, MemoryCacheService>();

    /// <summary>
    /// Adds the distributed cache service to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    public static void AddDistributedCacheService(this IServiceCollection services) =>
        services.AddScoped<ICacheService, DistributedCacheService>();

    /// <summary>
    /// Adds the infrastructure services to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services) =>
        services
            .AddScoped<WriteDbContext>()
            .AddScoped<EventStoreDbContext>()
            .AddScoped<IUnitOfWork, UnitOfWork>();

    /// <summary>
    /// Adds the write-only repositories to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    public static IServiceCollection AddWriteOnlyRepositories(this IServiceCollection services) =>
         services;
    //        .AddScoped<IEventStoreRepository<EventStore>, EventStoreRepository>()
    //        .AddScoped<IExerciseWriteOnlyRepository<Exercise, ExerciseId>, ExerciseWriteOnlyRepository>()
    //        .AddScoped<IExerciseUniquenessChecker, ExerciseWriteOnlyRepository>()
    //        .AddScoped<IExerciseResourceLinkUniquenessChecker, ExerciseWriteOnlyRepository>();
}
