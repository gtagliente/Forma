using Forma.Domain.Entities.RoutineAggregate.Contracts;

namespace Forma.Domain.Builders.Contracts;

public interface IRoutineBuilder
{
    Contracts _contracts { internal get; init; }

    struct Contracts
    {
        public readonly IRoutineUniquenessChecker uniquenessChecker { get; init; }

        public readonly IWorkoutReferenceChecker workoutReferenceChecker { get; init; }
    }
}
