using FluentValidation;

namespace Forma.Application.Workout.Commands;

public class CreateWorkoutCommandValidator : AbstractValidator<CreateWorkoutCommand>
{
    public CreateWorkoutCommandValidator()
    {
        RuleFor(command => command.OwnerId)
            .NotEmpty();

        RuleFor(command => command.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(command => command.Exercises)
            .NotEmpty();

        RuleForEach(command => command.Exercises)
            .ChildRules(entry =>
            {
                entry.RuleFor(e => e.ExerciseId).NotEmpty();
                entry.RuleFor(e => e.Sets).GreaterThan(0);
                entry.RuleFor(e => e)
                    .Must(e => e.Reps.HasValue || e.DurationSeconds.HasValue)
                    .WithMessage("Each exercise entry must specify Reps and/or DurationSeconds.");
            });
    }
}
