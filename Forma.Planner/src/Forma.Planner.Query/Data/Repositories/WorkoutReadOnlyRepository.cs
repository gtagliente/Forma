using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Forma.Query.Abstractions;
using Forma.Query.Data.Repositories.Abstractions;
using Forma.Query.QueriesModel;
using MongoDB.Driver;

namespace Forma.Query.Data.Repositories;

internal class WorkoutReadOnlyRepository(IReadDbContext readDbContext)
    : BaseReadOnlyRepository<WorkoutQueryModel, Guid>(readDbContext), IWorkoutReadOnlyRepository
{
    public async Task<IEnumerable<WorkoutQueryModel>> GetAllForOwnerAsync(Guid ownerId)
    {
        var sort = Builders<WorkoutQueryModel>.Sort.Ascending(workout => workout.Name);

        var findOptions = new FindOptions<WorkoutQueryModel>
        {
            Sort = sort
        };

        using var asyncCursor = await Collection.FindAsync(w => w.OwnerId == ownerId, findOptions);
        return await asyncCursor.ToListAsync();
    }
}
