using Forma.Domain.Builders.Contracts;
using Forma.Domain.Entities.RoutineAggregate.Contracts;

namespace Forma.Domain.Builders;

internal class RoutineBuilder : IRoutineBuilder
{
    public IRoutineBuilder.Contracts _contracts { get; init; }

    public RoutineBuilder(IRoutineUniquenessChecker uniquenessChecker, IWorkoutReferenceChecker workoutReferenceChecker)
    {
        _contracts = new()
        {
            uniquenessChecker = uniquenessChecker,
            workoutReferenceChecker = workoutReferenceChecker
        };
    }
}
