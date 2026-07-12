using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Forma.CoreContext.SharedKernel;
using Forma.CoreContext.SharedKernel.Exceptions.DomainExceptions;
using Forma.Domain.Builders.Contracts;
using Forma.Domain.Entities.WorkoutAggregate.Events;

namespace Forma.Domain.Entities.WorkoutAggregate;

public class Workout : BaseEntity<WorkoutId>, IAggregateRoot
{
    public Guid OwnerId { get; private set; }
    public string Name { get; private set; } = default!;
    public int CurrentVersionNumber { get; private set; }

    private List<WorkoutVersion> _versions = [];
    public IReadOnlyCollection<WorkoutVersion> Versions => _versions;

    private Workout(WorkoutId id, Guid ownerId, string name)
        : base(id)
    {
        OwnerId = ownerId;
        Name = name;
    }

    private Workout()
    {
    } // For EF or serialization

    public static async Task<Workout> Create(
        IWorkoutBuilder builder,
        Guid ownerId,
        string name,
        IEnumerable<(Guid ExerciseId, int Sets, int? Reps, int? DurationSeconds, decimal? Weight, int? RestSeconds, int Sequence, Guid? GroupId)> exercises)
    {
        if (builder == null)
            throw new DomainBadCodeException($"Required builder {nameof(builder)}");
        var contracts = builder._contracts;

        if (contracts.uniquenessChecker == null)
            throw new DomainBadCodeException($"Required contract {nameof(contracts.uniquenessChecker)}");

        if (string.IsNullOrWhiteSpace(name))
            throw new DomainArgumentException("Workout name is required.");

        if (!await contracts.uniquenessChecker.IsUniqueAsync(name, ownerId))
            throw new DomainArgumentException("A workout with the same name already exists.");

        var workout = new Workout(WorkoutId.New(), ownerId, name);
        var version = WorkoutVersion.Create(workout.Id, versionNumber: 1, exercises);

        workout._versions.Add(version);
        workout.CurrentVersionNumber = version.VersionNumber;

        workout.AddDomainEvent(new WorkoutCreatedEvent(workout.Id, workout.OwnerId, workout.Name, version.VersionNumber, version.Entries));
        return workout;
    }

    public WorkoutVersion AddNewVersion(
        IEnumerable<(Guid ExerciseId, int Sets, int? Reps, int? DurationSeconds, decimal? Weight, int? RestSeconds, int Sequence, Guid? GroupId)> exercises)
    {
        var version = WorkoutVersion.Create(Id, CurrentVersionNumber + 1, exercises);

        _versions.Add(version);
        CurrentVersionNumber = version.VersionNumber;

        AddDomainEvent(new WorkoutVersionCreatedEvent(Id, OwnerId, Name, version.VersionNumber, version.Entries));
        return version;
    }
}
