using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Ardalis.Result;
using Forma.Application.Routine.Responses;
using Forma.Domain.Entities.WorkoutAggregate;
using MediatR;

namespace Forma.Application.Routine.Commands;

public class CreateRoutineCommand : IRequest<Result<CreatedRoutineResponse>>
{
    /// <summary>
    /// No auth exists yet, so this is caller-supplied — see docs/features/FT-003-routine-create.md (Design section).
    /// Unlike Exercise, there is no shared-library concept for Routine: always required.
    /// </summary>
    [Required]
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
