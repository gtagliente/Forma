using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Ardalis.Result;
using Ardalis.Result.FluentValidation;
using FluentValidation;
using MediatR;
using Forma.Application.Routine.Commands;
using Forma.Application.Routine.Responses;
using Forma.CoreInfrastructure.Abstractions;
using DOMAIN_ENTITIES = Forma.Domain.Entities;
using Forma.Domain.Builders.Contracts;
using Forma.Domain.Entities.RoutineAggregate;

namespace Forma.Application.Routine.Handlers;

public class CreateRoutineCommandHandler(
    IValidator<CreateRoutineCommand> validator,
    IRoutineWriteOnlyRepository<DOMAIN_ENTITIES.RoutineAggregate.Routine, RoutineId> repository,
    IRoutineBuilder builder,
    IUnitOfWork unitOfWork) : IRequestHandler<CreateRoutineCommand, Result<CreatedRoutineResponse>>
{
    public async Task<Result<CreatedRoutineResponse>> Handle(
        CreateRoutineCommand request,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
            return Result<CreatedRoutineResponse>.Invalid(validationResult.AsErrors());

        var entries = request.Entries.Select(e => (e.WorkoutId, e.DayOfWeek, e.Sequence));

        var routine = await DOMAIN_ENTITIES.RoutineAggregate.Routine.Create(builder, request.OwnerId, request.Name, entries);

        repository.Add(routine);
        await unitOfWork.SaveChangesAsync();

        return Result<CreatedRoutineResponse>.Created(
            new CreatedRoutineResponse(routine.Id.Value), location: $"/api/routines/{routine.Id}");
    }
}
