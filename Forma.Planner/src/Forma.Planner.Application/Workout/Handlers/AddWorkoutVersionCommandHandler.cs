using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Ardalis.Result;
using Ardalis.Result.FluentValidation;
using FluentValidation;
using MediatR;
using Forma.Application.Workout.Commands;
using Forma.CoreInfrastructure.Abstractions;
using DOMAIN_ENTITIES = Forma.Domain.Entities;
using Forma.Domain.Entities.WorkoutAggregate;

namespace Forma.Application.Workout.Handlers;

public class AddWorkoutVersionCommandHandler(
    IValidator<AddWorkoutVersionCommand> validator,
    IWorkoutWriteOnlyRepository<DOMAIN_ENTITIES.WorkoutAggregate.Workout, WorkoutId> workoutRepository,
    IWorkoutVersionWriteOnlyRepository<WorkoutVersion, WorkoutVersionId> workoutVersionRepository,
    IUnitOfWork unitOfWork) : IRequestHandler<AddWorkoutVersionCommand, Result>
{
    public async Task<Result> Handle(AddWorkoutVersionCommand request, CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return Result.Invalid(validationResult.AsErrors());

        var workout = await workoutRepository.GetByIdAsync(request.WorkoutId);
        if (workout == null)
            return Result.NotFound($"Workout with Id {request.WorkoutId} not found");

        if (workout.OwnerId != request.OwnerId)
            return Result.Forbidden();

        var exercises = request.Exercises.Select(e =>
            (e.ExerciseId, e.Sets, e.Reps, e.DurationSeconds, e.Weight, e.RestSeconds, e.Sequence, e.GroupId));

        var newVersion = workout.AddNewVersion(exercises);

        // workout was loaded untracked and its WorkoutVersion key is client-generated (always
        // non-default), so repository.Update(workout) would misclassify the new version as
        // Modified rather than Added. Track the two changes separately instead: the new version
        // via its own repository (Added, unconditional), and just the one changed scalar on the
        // root via MarkModified (touches nothing in the Versions navigation).
        workoutVersionRepository.Add(newVersion);
        workoutRepository.MarkModified(workout, w => w.CurrentVersionNumber);
        await unitOfWork.SaveChangesAsync();

        return Result.SuccessWithMessage($"New version created: {newVersion.VersionNumber}");
    }
}
