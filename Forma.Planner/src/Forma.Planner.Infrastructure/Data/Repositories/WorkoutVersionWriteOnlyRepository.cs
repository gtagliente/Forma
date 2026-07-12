using Forma.CoreInfrastructure.Abstractions;
using Forma.Domain.Entities.WorkoutAggregate;
using Forma.Infrastructure.Data.Context;
using Forma.Infrastructure.Data.Repositories.Common;

namespace Forma.Infrastructure.Data.Repositories;

internal class WorkoutVersionWriteOnlyRepository(WriteDbContext dbContext)
    : BaseWriteOnlyRepository<WorkoutVersion, WorkoutVersionId>(dbContext),
      IWorkoutVersionWriteOnlyRepository<WorkoutVersion, WorkoutVersionId>;
