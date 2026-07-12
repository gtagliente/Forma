using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Ardalis.Result;
using Forma.Application.Workout.Responses;
using MediatR;

namespace Forma.Application.Workout.Commands;

public class CreateWorkoutCommand : IRequest<Result<CreatedWorkoutResponse>>
{
    /// <summary>
    /// No auth exists yet, so this is caller-supplied — see FT-001-workout-create/design.md.
    /// Unlike Exercise, there is no shared-library concept for Workout: always required.
    /// </summary>
    [Required]
    public Guid OwnerId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; }

    [Required]
    public IEnumerable<WorkoutExerciseEntryDto> Exercises { get; set; }
}

public class WorkoutExerciseEntryDto
{
    [Required]
    public Guid ExerciseId { get; set; }

    [Required]
    public int Sets { get; set; }

    public int? Reps { get; set; }

    public int? DurationSeconds { get; set; }

    public decimal? Weight { get; set; }

    public int? RestSeconds { get; set; }

    [Required]
    public int Sequence { get; set; }

    public Guid? GroupId { get; set; }
}
