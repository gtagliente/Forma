using System;
using Forma.CoreInfrastructure.Abstractions;

namespace Forma.Application.Routine.Responses;

public class CreatedRoutineResponse(Guid id) : IResponse
{
    public Guid Id { get; } = id;
}
