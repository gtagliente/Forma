using System;
using System.Collections.Generic;

namespace Forma.Domain.Entities.RoutineAggregate.Events;

public class RoutineCreatedEvent(
    RoutineId aggregateId,
    Guid ownerId,
    string name,
    IReadOnlyCollection<RoutineEntry> entries) : RoutineBaseEvent(aggregateId, ownerId, name)
{
    public IReadOnlyCollection<RoutineEntry> Entries { get; } = entries;
}
