using System;
using System.Collections.Generic;
using Forma.Query.Abstractions;

namespace Forma.Query.QueriesModel;

public class RoutineQueryModel : IQueryModel<Guid>
{
    public Guid Id { get; init; }
    public Guid OwnerId { get; init; }
    public string Name { get; init; }
    public IReadOnlyCollection<RoutineEntryQueryModel> Entries { get; init; }
}

public class RoutineEntryQueryModel
{
    public Guid WorkoutId { get; init; }
    public DayOfWeek? DayOfWeek { get; init; }
    public int Sequence { get; init; }
}
