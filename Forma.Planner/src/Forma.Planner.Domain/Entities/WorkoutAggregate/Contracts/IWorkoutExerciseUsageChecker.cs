using System;
using System.Threading.Tasks;

namespace Forma.Domain.Entities.WorkoutAggregate.Contracts;

/// <summary>
/// Cross-service check (ADR-006, Rule 2, Forma.Claude/docs/architecture/adr/ADR-006-cross-service-reference-integrity.md):
/// exercise-service asks, before deleting an Exercise, whether any Workout still references it.
/// Scoped to each Workout's <em>current</em> version only (provisional default recorded in
/// Forma.Claude/docs/architecture/integration-patterns.md — historical versions are frozen
/// record and tolerate a Dangling Reference like any other read).
/// </summary>
public interface IWorkoutExerciseUsageChecker
{
    Task<bool> IsExerciseReferencedInCurrentVersionAsync(Guid exerciseId);
}
