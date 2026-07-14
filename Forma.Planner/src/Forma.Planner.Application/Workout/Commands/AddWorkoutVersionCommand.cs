using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Ardalis.Result;
using Forma.Domain.Entities.WorkoutAggregate;
using MediatR;

namespace Forma.Application.Workout.Commands;

public class AddWorkoutVersionCommand : IRequest<Result>
{
    [Required]
    public WorkoutId WorkoutId { get; set; }

    /// <summary>
    /// Server-derived from the authenticated caller (ADR-007) — not client-bindable. The
    /// controller sets this from <c>ICurrentUserAccessor.UserId</c> after model binding, before
    /// dispatching the command. Must match the Workout's owner or the request is rejected
    /// (403) — this is what makes <c>AddWorkoutVersionCommandHandler</c>'s existing ownership
    /// check (previously cosmetic, since this value used to be caller-supplied) actually
    /// secure.
    /// </summary>
    [JsonIgnore]
    public Guid OwnerId { get; set; }

    [Required]
    public IEnumerable<WorkoutExerciseEntryDto> Exercises { get; set; }
}
