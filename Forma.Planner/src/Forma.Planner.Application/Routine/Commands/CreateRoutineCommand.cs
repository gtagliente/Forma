using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Ardalis.Result;
using Forma.Application.Routine.Responses;
using Forma.Domain.Entities.WorkoutAggregate;
using MediatR;

namespace Forma.Application.Routine.Commands;

public class CreateRoutineCommand : IRequest<Result<CreatedRoutineResponse>>
{
    /// <summary>
    /// Server-derived from the authenticated caller (ADR-007) — not client-bindable. The
    /// controller sets this from <c>ICurrentUserAccessor.UserId</c> after model binding, before
    /// dispatching the command. Unlike Exercise, there is no shared-library concept for
    /// Routine: always required.
    /// </summary>
    [JsonIgnore]
    public Guid OwnerId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; }

    [Required]
    public IEnumerable<RoutineEntryDto> Entries { get; set; }
}

public class RoutineEntryDto
{
    [Required]
    public WorkoutId WorkoutId { get; set; }

    public DayOfWeek? DayOfWeek { get; set; }

    [Required]
    public int Sequence { get; set; }
}
