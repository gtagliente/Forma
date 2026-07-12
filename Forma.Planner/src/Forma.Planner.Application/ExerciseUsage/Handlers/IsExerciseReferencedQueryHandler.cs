using System.Threading;
using System.Threading.Tasks;
using Ardalis.Result;
using Ardalis.Result.FluentValidation;
using FluentValidation;
using Forma.Application.ExerciseUsage.Queries;
using Forma.Domain.Entities.WorkoutAggregate.Contracts;
using MediatR;

namespace Forma.Application.ExerciseUsage.Handlers;

public class IsExerciseReferencedQueryHandler(
    IValidator<IsExerciseReferencedQuery> validator,
    IWorkoutExerciseUsageChecker checker) : IRequestHandler<IsExerciseReferencedQuery, Result<bool>>
{
    public async Task<Result<bool>> Handle(IsExerciseReferencedQuery request, CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return Result<bool>.Invalid(validationResult.AsErrors());

        return Result<bool>.Success(await checker.IsExerciseReferencedInCurrentVersionAsync(request.ExerciseId));
    }
}
