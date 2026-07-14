using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ardalis.Result;
using Forma.CoreInfrastructure.Abstractions;
using Forma.CoreInfrastructure.Caching;
using Forma.Query.Application.Workout.Queries;
using Forma.Query.Data.Repositories.Abstractions;
using Forma.Query.QueriesModel;
using MediatR;

namespace Forma.Query.Application.Workout.Handlers;

public class GetAllWorkoutQueryHandler(IWorkoutReadOnlyRepository repository, ICacheService cacheService)
    : IRequestHandler<GetAllWorkoutQuery, Result<IEnumerable<WorkoutQueryModel>>>
{
    public async Task<Result<IEnumerable<WorkoutQueryModel>>> Handle(
        GetAllWorkoutQuery request,
        CancellationToken cancellationToken)
    {
        var cacheKey = WorkoutCacheKeys.ForUser(request.RequestingUserId);

        return Result<IEnumerable<WorkoutQueryModel>>.Success(
            await cacheService.GetOrCreateAsync(cacheKey, () => repository.GetAllForOwnerAsync(request.RequestingUserId)));
    }
}
