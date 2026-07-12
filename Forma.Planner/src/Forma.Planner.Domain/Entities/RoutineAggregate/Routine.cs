using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Forma.CoreContext.SharedKernel;
using Forma.CoreContext.SharedKernel.Exceptions.DomainExceptions;
using Forma.Domain.Builders.Contracts;
using Forma.Domain.Entities.RoutineAggregate.Events;
using Forma.Domain.Entities.WorkoutAggregate;

namespace Forma.Domain.Entities.RoutineAggregate;

public class Routine : BaseEntity<RoutineId>, IAggregateRoot
{
    public Guid OwnerId { get; private set; }
    public string Name { get; private set; } = default!;

    private List<RoutineEntry> _entries = [];
    public IReadOnlyCollection<RoutineEntry> Entries => _entries;

    private Routine(RoutineId id, Guid ownerId, string name, List<RoutineEntry> entries)
        : base(id)
    {
        OwnerId = ownerId;
        Name = name;
        _entries = entries;
    }

    private Routine()
    {
    } // For EF or serialization

    public static async Task<Routine> Create(
        IRoutineBuilder builder,
        Guid ownerId,
        string name,
        IEnumerable<(WorkoutId WorkoutId, DayOfWeek? DayOfWeek, int Sequence)> entries)
    {
        if (builder == null)
            throw new DomainBadCodeException($"Required builder {nameof(builder)}");
        var contracts = builder._contracts;

        if (contracts.uniquenessChecker == null)
            throw new DomainBadCodeException($"Required contract {nameof(contracts.uniquenessChecker)}");
        if (contracts.workoutReferenceChecker == null)
            throw new DomainBadCodeException($"Required contract {nameof(contracts.workoutReferenceChecker)}");

        if (string.IsNullOrWhiteSpace(name))
            throw new DomainArgumentException("Routine name is required.");

        if (!await contracts.uniquenessChecker.IsUniqueAsync(name, ownerId))
            throw new DomainArgumentException("A routine with the same name already exists.");

        var entryList = entries.ToList();
        if (entryList.Count == 0)
            throw new DomainArgumentException("A routine requires at least one entry.");

        foreach (var workoutId in entryList.Select(e => e.WorkoutId).Distinct())
        {
            if (!await contracts.workoutReferenceChecker.ExistsForOwnerAsync(workoutId, ownerId))
                throw new DomainArgumentException($"No workout found by Id: {workoutId}");
        }

        var routineEntries = entryList
            .Select(e => new RoutineEntry(e.WorkoutId, e.DayOfWeek, e.Sequence))
            .ToList();

        var routine = new Routine(RoutineId.New(), ownerId, name, routineEntries);

        routine.AddDomainEvent(new RoutineCreatedEvent(routine.Id, routine.OwnerId, routine.Name, routine.Entries));
        return routine;
    }
}
