using System;
using System.Threading.Tasks;

namespace Forma.Domain.Entities.WorkoutAggregate.Contracts;

public interface IWorkoutUniquenessChecker
{
    /// <summary>
    /// Checks if a workout name is unique among the given owner's own Workouts.
    /// </summary>
    Task<bool> IsUniqueAsync(string name, Guid ownerId);
}
