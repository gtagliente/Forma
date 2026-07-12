using System;
using System.Collections.Generic;
using System.Linq;
using Forma.CoreContext.SharedKernel;
using Forma.CoreContext.SharedKernel.Exceptions.DomainExceptions;

namespace Forma.Domain.Entities.WorkoutAggregate;

/// <summary>
/// A single immutable version of a Workout (ADR-002: editing a Workout creates a new version
/// rather than mutating the existing one in place). Child entity of Workout — no meaning
/// detached from its parent, so no independent visibility/ownership of its own.
/// </summary>
public class WorkoutVersion : IEntity<WorkoutVersionId>
{
    public WorkoutVersionId Id { get; private set; }
    public WorkoutId WorkoutId { get; private set; }
    public int VersionNumber { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private List<WorkoutExerciseEntry> _entries = [];
    public IReadOnlyCollection<WorkoutExerciseEntry> Entries => _entries;

    private WorkoutVersion()
    {
    }

    private WorkoutVersion(WorkoutId workoutId, int versionNumber, List<WorkoutExerciseEntry> entries)
    {
        Id = WorkoutVersionId.New();
        WorkoutId = workoutId;
        VersionNumber = versionNumber;
        CreatedAt = DateTime.UtcNow;
        _entries = entries;
    }

    internal static WorkoutVersion Create(
        WorkoutId workoutId,
        int versionNumber,
        IEnumerable<(Guid ExerciseId, int Sets, int? Reps, int? DurationSeconds, decimal? Weight, int? RestSeconds, int Sequence, Guid? GroupId)> exercises)
    {
        var entries = exercises
            .Select(e => new WorkoutExerciseEntry(e.ExerciseId, e.Sets, e.Reps, e.DurationSeconds, e.Weight, e.RestSeconds, e.Sequence, e.GroupId))
            .ToList();

        if (entries.Count == 0)
            throw new DomainArgumentException("A workout version requires at least one exercise entry.");

        foreach (var entry in entries)
        {
            if (entry.Sets <= 0)
                throw new DomainArgumentException("Each exercise entry must have at least one set.");
            if (entry.Reps is null && entry.DurationSeconds is null)
                throw new DomainArgumentException("Each exercise entry must specify Reps and/or DurationSeconds.");
        }

        return new WorkoutVersion(workoutId, versionNumber, entries);
    }
}

public readonly record struct WorkoutVersionId(Guid Value)
{
    public static WorkoutVersionId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
