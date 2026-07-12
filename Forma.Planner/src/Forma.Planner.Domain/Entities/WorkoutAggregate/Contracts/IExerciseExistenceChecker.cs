using System;
using System.Threading.Tasks;

namespace Forma.Domain.Entities.WorkoutAggregate.Contracts;

/// <summary>
/// Cross-service check (ADR-006 Rule 1, Forma.Claude/docs/architecture/adr/ADR-006-cross-service-reference-integrity.md):
/// at Workout create/edit, asks exercise-service whether a referenced Exercise Id exists.
/// Best-effort only — the implementation fails open. An inconclusive answer (timeout,
/// unreachable) must be treated as "exists," never block the save; only a confirmed 404 does.
/// </summary>
public interface IExerciseExistenceChecker
{
    Task<bool> ExistsAsync(Guid exerciseId);
}
