using System;
using Forma.CoreContext.SharedKernel;

namespace Forma.Domain.Entities.RoutineAggregate.Events;

public abstract class RoutineBaseEvent : BaseEvent
{
    protected RoutineBaseEvent(RoutineId aggregateId, Guid ownerId, string name)
    {
        Id = Guid.NewGuid();
        AggregateId = aggregateId.Value;
        OwnerId = ownerId;
        Name = name;
    }

    public Guid OwnerId { get; private init; }
    public string Name { get; private init; }
}
