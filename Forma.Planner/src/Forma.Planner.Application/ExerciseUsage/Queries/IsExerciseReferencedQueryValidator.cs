using FluentValidation;

namespace Forma.Application.ExerciseUsage.Queries;

public class IsExerciseReferencedQueryValidator : AbstractValidator<IsExerciseReferencedQuery>
{
    public IsExerciseReferencedQueryValidator()
    {
        RuleFor(query => query.ExerciseId)
            .NotEmpty();
    }
}
