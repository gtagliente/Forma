using System;

namespace Forma.Domain.Entities.WorkoutAggregate;

/// <summary>
/// An entry within a WorkoutVersion. Owned type, no identity of its own — not addressable
/// outside its parent version, matching the central decision that "Set" has no identity
/// outside its parent.
/// </summary>
public class WorkoutExerciseEntry
{
    public Guid ExerciseId { get; private set; }
    public int Sets { get; private set; }
    public int? Reps { get; private set; }
    public int? DurationSeconds { get; private set; }
    public decimal? Weight { get; private set; }
    public int? RestSeconds { get; private set; }
    public int Sequence { get; private set; }
    public Guid? GroupId { get; private set; }

    private WorkoutExerciseEntry()
    {
    }

    internal WorkoutExerciseEntry(
        Guid exerciseId,
        int sets,
        int? reps,
        int? durationSeconds,
        decimal? weight,
        int? restSeconds,
        int sequence,
        Guid? groupId)
    {
        ExerciseId = exerciseId;
        Sets = sets;
        Reps = reps;
        DurationSeconds = durationSeconds;
        Weight = weight;
        RestSeconds = restSeconds;
        Sequence = sequence;
        GroupId = groupId;
    }
}
