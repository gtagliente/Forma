using System;
using System.Collections.Generic;
using Forma.Query.Abstractions;

namespace Forma.Query.QueriesModel;

public class WorkoutQueryModel : IQueryModel<Guid>
{
    public Guid Id { get; init; }
    public Guid OwnerId { get; init; }
    public string Name { get; init; }
    public int CurrentVersionNumber { get; init; }
    public IReadOnlyCollection<WorkoutExerciseEntryQueryModel> Exercises { get; init; }
}

public class WorkoutExerciseEntryQueryModel
{
    public Guid ExerciseId { get; init; }
    public int Sets { get; init; }
    public int? Reps { get; init; }
    public int? DurationSeconds { get; init; }
    public decimal? Weight { get; init; }
    public int? RestSeconds { get; init; }
    public int Sequence { get; init; }
    public Guid? GroupId { get; init; }
}
