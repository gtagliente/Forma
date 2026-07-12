using System;
using System.Threading.Tasks;

namespace Forma.Domain.Entities.RoutineAggregate.Contracts;

public interface IRoutineUniquenessChecker
{
    /// <summary>
    /// Checks if a routine name is unique among the given owner's own Routines.
    /// </summary>
    Task<bool> IsUniqueAsync(string name, Guid ownerId);
}
