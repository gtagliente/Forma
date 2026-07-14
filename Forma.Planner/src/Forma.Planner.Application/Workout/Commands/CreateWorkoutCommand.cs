using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Ardalis.Result;
using Forma.Application.Workout.Responses;
using MediatR;

namespace Forma.Application.Workout.Commands;

public class CreateWorkoutCommand : IRequest<Result<CreatedWorkoutResponse>>
{
    /// <summary>
    /// Server-derived from the authenticated caller (ADR-007) — not client-bindable. The
    /// controller sets this from <c>ICurrentUserAccessor.UserId</c> after model binding, before
    /// dispatching the command. Unlike Exercise, there is no shared-library concept for
    /// Workout: always required.
    /// </summary>
    [JsonIgnore]
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
