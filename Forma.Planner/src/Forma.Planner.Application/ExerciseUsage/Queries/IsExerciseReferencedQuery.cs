using System;
using System.ComponentModel.DataAnnotations;
using Ardalis.Result;
using MediatR;

namespace Forma.Application.ExerciseUsage.Queries;

/// <summary>
/// ADR-006 Rule 2 (Forma.Claude/docs/architecture/adr/ADR-006-cross-service-reference-integrity.md):
/// backs the internal, cross-service endpoint exercise-service calls before allowing an Exercise
/// delete. Answers against the write model directly — see
/// <see cref="Forma.Domain.Entities.WorkoutAggregate.Contracts.IWorkoutExerciseUsageChecker"/>.
/// </summary>
public class IsExerciseReferencedQuery(Guid exerciseId) : IRequest<Result<bool>>
{
    [Required]
    public Guid ExerciseId { get; } = exerciseId;
}
