using FluentValidation;

namespace Forma.Application.Routine.Commands;

public class CreateRoutineCommandValidator : AbstractValidator<CreateRoutineCommand>
{
    public CreateRoutineCommandValidator()
    {
        RuleFor(command => command.OwnerId)
            .NotEmpty();

        RuleFor(command => command.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(command => command.Entries)
            .NotEmpty();

        RuleForEach(command => command.Entries)
            .ChildRules(entry => entry.RuleFor(e => e.WorkoutId).NotEmpty());
    }
}
