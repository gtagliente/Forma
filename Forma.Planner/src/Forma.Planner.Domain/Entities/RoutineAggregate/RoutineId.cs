using System;

namespace Forma.Domain.Entities.RoutineAggregate;

public readonly record struct RoutineId(Guid Value)
{
    public static RoutineId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
