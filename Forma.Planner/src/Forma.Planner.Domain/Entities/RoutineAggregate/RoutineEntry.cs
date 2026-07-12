using System;
using Forma.Domain.Entities.WorkoutAggregate;

namespace Forma.Domain.Entities.RoutineAggregate;

/// <summary>
/// A reference to a Workout within a Routine. Owned type, no identity of its own — matches
/// the same "no identity outside its parent" shape as WorkoutExerciseEntry. References the
/// Workout by identity only, live — never a snapshot (ADR-002: a Routine always resolves to
/// whichever Workout version is current when read).
/// </summary>
public class RoutineEntry
{
    public WorkoutId WorkoutId { get; private set; }
    public DayOfWeek? DayOfWeek { get; private set; }
    public int Sequence { get; private set; }

    private RoutineEntry()
    {
    }

    internal RoutineEntry(WorkoutId workoutId, DayOfWeek? dayOfWeek, int sequence)
    {
        WorkoutId = workoutId;
        DayOfWeek = dayOfWeek;
        Sequence = sequence;
    }
}
