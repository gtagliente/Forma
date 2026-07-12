using Forma.Domain.Builders.Contracts;
using Forma.Domain.Entities.WorkoutAggregate.Contracts;

namespace Forma.Domain.Builders;

internal class WorkoutBuilder : IWorkoutBuilder
{
    public IWorkoutBuilder.Contracts _contracts { get; init; }

    public WorkoutBuilder(IWorkoutUniquenessChecker uniquenessChecker)
    {
        _contracts = new()
        {
            uniquenessChecker = uniquenessChecker
        };
    }
}
