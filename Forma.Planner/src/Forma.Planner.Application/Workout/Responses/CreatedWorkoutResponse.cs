using System;
using Forma.CoreInfrastructure.Abstractions;

namespace Forma.Application.Workout.Responses;

public class CreatedWorkoutResponse(Guid id) : IResponse
{
    public Guid Id { get; } = id;
}
