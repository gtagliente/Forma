using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Forma.Query.QueriesModel;
using Forma.Query.Abstractions;

namespace Forma.Query.Data.Repositories.Abstractions;

public interface IRoutineReadOnlyRepository : IReadOnlyRepository<RoutineQueryModel, Guid>
{
    Task<IEnumerable<RoutineQueryModel>> GetAllForOwnerAsync(Guid ownerId);
}
