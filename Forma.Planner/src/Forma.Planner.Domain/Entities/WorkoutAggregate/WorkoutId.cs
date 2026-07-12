using System;

namespace Forma.Domain.Entities.WorkoutAggregate;

public readonly record struct WorkoutId(Guid Value)
{
    public static WorkoutId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
