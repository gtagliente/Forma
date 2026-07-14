using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ardalis.Result;
using Forma.CoreInfrastructure.Abstractions;
using Forma.CoreInfrastructure.Caching;
using Forma.Query.Application.Routine.Queries;
using Forma.Query.Data.Repositories.Abstractions;
using Forma.Query.QueriesModel;
using MediatR;

namespace Forma.Query.Application.Routine.Handlers;

public class GetAllRoutineQueryHandler(IRoutineReadOnlyRepository repository, ICacheService cacheService)
    : IRequestHandler<GetAllRoutineQuery, Result<IEnumerable<RoutineQueryModel>>>
{
    public async Task<Result<IEnumerable<RoutineQueryModel>>> Handle(
        GetAllRoutineQuery request,
        CancellationToken cancellationToken)
    {
        var cacheKey = RoutineCacheKeys.ForUser(request.RequestingUserId);

        return Result<IEnumerable<RoutineQueryModel>>.Success(
            await cacheService.GetOrCreateAsync(cacheKey, () => repository.GetAllForOwnerAsync(request.RequestingUserId)));
    }
}
