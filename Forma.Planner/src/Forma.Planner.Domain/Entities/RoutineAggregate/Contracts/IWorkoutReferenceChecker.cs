using System;
using System.Threading.Tasks;
using Forma.Domain.Entities.WorkoutAggregate;

namespace Forma.Domain.Entities.RoutineAggregate.Contracts;

/// <summary>
/// Cross-aggregate check: unlike Exercise (a separate service, unvalidatable), Workout is owned
/// by this same service, so a Routine referencing one can actually verify it exists and belongs
/// to the same owner.
/// </summary>
public interface IWorkoutReferenceChecker
{
    Task<bool> ExistsForOwnerAsync(WorkoutId workoutId, Guid ownerId);
}
