using System;
using System.Diagnostics.CodeAnalysis;
using System.Net.Http;
using Forma.CoreContext.SharedKernel;
using Forma.CoreInfrastructure.Abstractions;
using Forma.Domain.Entities.RoutineAggregate;
using Forma.Domain.Entities.RoutineAggregate.Contracts;
using Forma.Domain.Entities.WorkoutAggregate;
using Forma.Domain.Entities.WorkoutAggregate.Contracts;
using Forma.Infrastructure.Data;
using Forma.Infrastructure.Data.Context;
using Forma.Infrastructure.Data.Repositories;
using Forma.Infrastructure.Data.Services;
using Forma.Infrastructure.ExternalServices.ExerciseService;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Kiota.Abstractions;
using Microsoft.Kiota.Abstractions.Authentication;
using Microsoft.Kiota.Http.HttpClientLibrary;
using Polly;
using Polly.Timeout;

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
         services
            .AddScoped<IEventStoreRepository<EventStore>, EventStoreRepository>()
            .AddScoped<IWorkoutWriteOnlyRepository<Workout, WorkoutId>, WorkoutWriteOnlyRepository>()
            .AddScoped<IWorkoutUniquenessChecker, WorkoutWriteOnlyRepository>()
            .AddScoped<IWorkoutReferenceChecker, WorkoutWriteOnlyRepository>()
            .AddScoped<IWorkoutExerciseUsageChecker, WorkoutWriteOnlyRepository>()
            .AddScoped<IWorkoutVersionWriteOnlyRepository<WorkoutVersion, WorkoutVersionId>, WorkoutVersionWriteOnlyRepository>()
            .AddScoped<IRoutineWriteOnlyRepository<Routine, RoutineId>, RoutineWriteOnlyRepository>()
            .AddScoped<IRoutineUniquenessChecker, RoutineWriteOnlyRepository>();

    /// <summary>
    /// Adds typed HTTP clients for the other services this one calls directly (ADR-006 —
    /// Forma.Claude/docs/architecture/adr/ADR-006-cross-service-reference-integrity.md).
    /// Unauthenticated for now — a deliberate, tracked deferral until identity-service exists
    /// (see Forma.Claude/docs/architecture/integration-patterns.md, "Security note").
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">App configuration, for the callee's base URL.</param>
    public static IServiceCollection AddExternalServiceClients(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddHttpClient("ExerciseService", client =>
            {
                var baseUrl = configuration["Services:ExerciseService:BaseUrl"]
                    ?? throw new InvalidOperationException("Missing configuration: Services:ExerciseService:BaseUrl");
                client.BaseAddress = new Uri(baseUrl);
            })
            // ADR-006 Rule 1 (Workout create/edit -> Exercise existence check): fails open, so
            // the timeout must stay short — it must not materially delay a save the user is
            // actively waiting on. See integration-patterns.md's per-direction table.
            .AddResilienceHandler("exercise-service", builder =>
                builder.AddTimeout(TimeSpan.FromSeconds(2)));

        return services
            .AddScoped<IRequestAdapter>(provider =>
            {
                var httpClient = provider
                    .GetRequiredService<IHttpClientFactory>()
                    .CreateClient("ExerciseService");
                return new HttpClientRequestAdapter(new AnonymousAuthenticationProvider(), httpClient: httpClient);
            })
            .AddScoped<ExerciseServiceApiClient>()
            .AddScoped<IExerciseExistenceChecker, ExerciseExistenceChecker>();
    }
}
