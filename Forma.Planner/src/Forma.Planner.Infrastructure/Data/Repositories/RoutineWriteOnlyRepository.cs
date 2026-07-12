using System;
using System.Threading.Tasks;
using Forma.CoreInfrastructure.Abstractions;
using Forma.Domain.Entities.RoutineAggregate;
using Forma.Domain.Entities.RoutineAggregate.Contracts;
using Forma.Infrastructure.Data.Context;
using Forma.Infrastructure.Data.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Forma.Infrastructure.Data.Repositories;

internal class RoutineWriteOnlyRepository(WriteDbContext dbContext)
    : BaseWriteOnlyRepository<Routine, RoutineId>(dbContext), IRoutineWriteOnlyRepository<Routine, RoutineId>, IRoutineUniquenessChecker
{
    public async Task<bool> IsUniqueAsync(string name, Guid ownerId)
    {
        return !await DbContext.Set<Routine>()
            .AnyAsync(r => r.Name == name && r.OwnerId == ownerId);
    }
}
