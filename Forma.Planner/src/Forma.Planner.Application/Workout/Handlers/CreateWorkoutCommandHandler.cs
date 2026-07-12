using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Ardalis.Result;
using Ardalis.Result.FluentValidation;
using FluentValidation;
using MediatR;
using Forma.Application.Workout.Commands;
using Forma.Application.Workout.Responses;
using Forma.CoreInfrastructure.Abstractions;
using DOMAIN_ENTITIES = Forma.Domain.Entities;
using Forma.Domain.Builders.Contracts;
using Forma.Domain.Entities.WorkoutAggregate;

namespace Forma.Application.Workout.Handlers;

public class CreateWorkoutCommandHandler(
    IValidator<CreateWorkoutCommand> validator,
    IWorkoutWriteOnlyRepository<DOMAIN_ENTITIES.WorkoutAggregate.Workout, WorkoutId> repository,
    IWorkoutBuilder builder,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateWorkoutCommand, Result<CreatedWorkoutResponse>>
{
    public async Task<Result<CreatedWorkoutResponse>> Handle(
        CreateWorkoutCommand request,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return Result<CreatedWorkoutResponse>.Invalid(validationResult.AsErrors());

        var exercises = request.Exercises.Select(e =>
            (e.ExerciseId, e.Sets, e.Reps, e.DurationSeconds, e.Weight, e.RestSeconds, e.Sequence, e.GroupId));

        var workout = await DOMAIN_ENTITIES.WorkoutAggregate.Workout.Create(builder, request.OwnerId, request.Name, exercises);

        repository.Add(workout);
        await unitOfWork.SaveChangesAsync();

        return Result<CreatedWorkoutResponse>.Created(
            new CreatedWorkoutResponse(workout.Id.Value), location: $"/api/workouts/{workout.Id}");
    }
}
