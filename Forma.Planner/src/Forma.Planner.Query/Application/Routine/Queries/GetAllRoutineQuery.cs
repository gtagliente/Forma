using System;
using System.Collections.Generic;
using Ardalis.Result;
using MediatR;
using Forma.Query.QueriesModel;

namespace Forma.Query.Application.Routine.Queries;

public class GetAllRoutineQuery(Guid requestingUserId) : IRequest<Result<IEnumerable<RoutineQueryModel>>>
{
    public Guid RequestingUserId { get; } = requestingUserId;
}
