using System;
using System.Net;
using System.Threading.Tasks;
using Forma.Domain.Entities.WorkoutAggregate.Contracts;
using Forma.Infrastructure.ExternalServices.ExerciseService.Models;
using Microsoft.Extensions.Logging;

namespace Forma.Infrastructure.ExternalServices.ExerciseService;

/// <summary>
/// ADR-006 Rule 1 adapter: wraps the Kiota-generated <see cref="ExerciseServiceApiClient"/>.
/// Fails open by construction — only a confirmed 404 (exercise-service ran the check and
/// affirmatively said "not found") returns false; a timeout (via the resilience handler
/// registered in ConfigureServices), connection failure, or any other error is treated as
/// inconclusive and returns true, so a save is never blocked by an unreachable dependency.
/// See Forma.Claude/docs/architecture/integration-patterns.md, "Security note" for the
/// still-unauthenticated state of this call.
/// </summary>
internal class ExerciseExistenceChecker(ExerciseServiceApiClient client, ILogger<ExerciseExistenceChecker> logger)
    : IExerciseExistenceChecker
{
    public async Task<bool> ExistsAsync(Guid exerciseId)
    {
        try
        {
            var response = await client.Api.Exercises[exerciseId].GetAsync();
            return response?.Result != null;
        }
        catch (ApiResponse ex) when (ex.ResponseStatusCode == (int)HttpStatusCode.NotFound)
        {
            // The only confirmed-negative case ADR-006 Rule 1 allows to block the save.
            return false;
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Could not confirm with exercise-service whether Exercise {ExerciseId} exists; proceeding (fail-open, ADR-006 Rule 1).",
                exerciseId);
            return true;
        }
    }
}
