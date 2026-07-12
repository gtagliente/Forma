using System;
using Forma.CoreContext.SharedKernel;

namespace Forma.Domain.Entities.WorkoutAggregate.Events;

public abstract class WorkoutBaseEvent : BaseEvent
{
    protected WorkoutBaseEvent(WorkoutId aggregateId, Guid ownerId, string name)
    {
        Id = Guid.NewGuid();
        AggregateId = aggregateId.Value;
        OwnerId = ownerId;
        Name = name;
    }

    public Guid OwnerId { get; private init; }
    public string Name { get; private init; }
}
