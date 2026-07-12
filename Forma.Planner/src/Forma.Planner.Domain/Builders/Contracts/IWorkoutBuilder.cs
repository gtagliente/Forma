using Forma.Domain.Entities.WorkoutAggregate.Contracts;

namespace Forma.Domain.Builders.Contracts;

public interface IWorkoutBuilder
{
    Contracts _contracts { internal get; init; }

    struct Contracts
    {
        public readonly IWorkoutUniquenessChecker uniquenessChecker { get; init; }

        public readonly IExerciseExistenceChecker existenceChecker { get; init; }
    }
}
