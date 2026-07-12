using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Ardalis.Result;
using Forma.Domain.Entities.WorkoutAggregate;
using MediatR;

namespace Forma.Application.Workout.Commands;

public class AddWorkoutVersionCommand : IRequest<Result>
{
    [Required]
    public WorkoutId WorkoutId { get; set; }

    /// <summary>
    /// Caller-supplied — no auth exists yet. Must match the Workout's owner or the request is
    /// rejected (403), see docs/features/FT-002-workout-new-version.md (Design section).
    /// </summary>
    [Required]
    public Guid OwnerId { get; set; }

    [Required]
    public IEnumerable<WorkoutExerciseEntryDto> Exercises { get; set; }
}
