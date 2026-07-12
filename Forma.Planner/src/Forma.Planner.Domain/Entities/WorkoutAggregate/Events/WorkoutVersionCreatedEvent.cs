using System;
using System.Collections.Generic;

namespace Forma.Domain.Entities.WorkoutAggregate.Events;

public class WorkoutVersionCreatedEvent(
    WorkoutId aggregateId,
    Guid ownerId,
    string name,
    int versionNumber,
    IReadOnlyCollection<WorkoutExerciseEntry> entries) : WorkoutBaseEvent(aggregateId, ownerId, name)
{
    public int VersionNumber { get; } = versionNumber;
    public IReadOnlyCollection<WorkoutExerciseEntry> Entries { get; } = entries;
}
