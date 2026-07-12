using System;
using System.Collections.Generic;
using Ardalis.Result;
using MediatR;
using Forma.Query.QueriesModel;

namespace Forma.Query.Application.Workout.Queries;

/// <summary>
/// Unlike Exercise, there is no shared-library concept for Workout — every Workout is
/// scoped to exactly one owner, so this is required, not optional.
/// </summary>
public class GetAllWorkoutQuery(Guid requestingUserId) : IRequest<Result<IEnumerable<WorkoutQueryModel>>>
{
    public Guid RequestingUserId { get; } = requestingUserId;
}
