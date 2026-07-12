using System;
using System.Threading.Tasks;
using Forma.CoreInfrastructure.Abstractions;
using Forma.Domain.Entities.RoutineAggregate.Contracts;
using Forma.Domain.Entities.WorkoutAggregate;
using Forma.Domain.Entities.WorkoutAggregate.Contracts;
using Forma.Infrastructure.Data.Context;
using Forma.Infrastructure.Data.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Forma.Infrastructure.Data.Repositories;

internal class WorkoutWriteOnlyRepository(WriteDbContext dbContext)
    : BaseWriteOnlyRepository<Workout, WorkoutId>(dbContext),
      IWorkoutWriteOnlyRepository<Workout, WorkoutId>,
      IWorkoutUniquenessChecker,
      IWorkoutReferenceChecker
{
    public async Task<bool> IsUniqueAsync(string name, Guid ownerId)
    {
        return !await DbContext.Set<Workout>()
            .AnyAsync(w => w.Name == name && w.OwnerId == ownerId);
    }

    public async Task<bool> ExistsForOwnerAsync(WorkoutId workoutId, Guid ownerId)
    {
        return await DbContext.Set<Workout>()
            .AnyAsync(w => w.Id == workoutId && w.OwnerId == ownerId);
    }
}
