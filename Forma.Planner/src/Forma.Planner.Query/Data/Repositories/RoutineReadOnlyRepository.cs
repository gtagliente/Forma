using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Forma.Query.Abstractions;
using Forma.Query.Data.Repositories.Abstractions;
using Forma.Query.QueriesModel;
using MongoDB.Driver;

namespace Forma.Query.Data.Repositories;

internal class RoutineReadOnlyRepository(IReadDbContext readDbContext)
    : BaseReadOnlyRepository<RoutineQueryModel, Guid>(readDbContext), IRoutineReadOnlyRepository
{
    public async Task<IEnumerable<RoutineQueryModel>> GetAllForOwnerAsync(Guid ownerId)
    {
        var sort = Builders<RoutineQueryModel>.Sort.Ascending(routine => routine.Name);

        var findOptions = new FindOptions<RoutineQueryModel>
        {
            Sort = sort
        };

        using var asyncCursor = await Collection.FindAsync(r => r.OwnerId == ownerId, findOptions);
        return await asyncCursor.ToListAsync();
    }
}
