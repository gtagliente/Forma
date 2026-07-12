# FT-003 — Routine Create — Design

## Shape

```
Routine (aggregate root, BaseEntity<RoutineId>)
  OwnerId: Guid (required — same as Workout, no shared/private duality)
  Name: string
  Entries: IReadOnlyCollection<RoutineEntry>  (owned type, no identity — same pattern as WorkoutExerciseEntry)

RoutineEntry (owned, no identity)
  WorkoutId: WorkoutId  (reference by identity only, live — never a snapshot, per ADR-002)
  DayOfWeek: DayOfWeek?  (nullable — lightweight recurring-style hint; the full scheduling model is still an open central question, this doesn't resolve it)
  Sequence: int  (ordering when DayOfWeek is absent, or multiple entries share a day)
```

No separate `RoutineVersion`-style concept — Routine itself isn't versioned centrally (only Workout is), so `Routine` stays a single, directly-mutable aggregate for any future Update.

## Cross-aggregate validation: does the Workout exist and belong to this owner?

Unlike FT-001's `ExerciseId` reference (unvalidatable — separate service/datastore), `WorkoutId` **is** owned by this same service, so this feature validates it — matching `requirements.md`. New Domain-layer contract, mirroring the existing `IWorkoutUniquenessChecker` pattern:

```csharp
// Forma.Domain.Entities.RoutineAggregate.Contracts
public interface IWorkoutReferenceChecker
{
    Task<bool> ExistsForOwnerAsync(WorkoutId workoutId, Guid ownerId);
}
```

Implemented by the **existing** `WorkoutWriteOnlyRepository` (already has `DbContext.Set<Workout>()` access, already does double duty as repository + checker for `IWorkoutUniquenessChecker`) — one more method, same class, same cross-aggregate-checker precedent `exercise-service` used for `IExerciseResourceLinkUniquenessChecker` living alongside `IExerciseUniquenessChecker` on one repository.

## Uniqueness & builder

`IRoutineUniquenessChecker.IsUniqueAsync(name, ownerId)` and `IRoutineBuilder` mirror `IWorkoutUniquenessChecker`/`IWorkoutBuilder` exactly, except `IRoutineBuilder.Contracts` carries **two** checkers (uniqueness + the new workout-reference checker), implemented by a new `RoutineWriteOnlyRepository` (uniqueness) delegating cross-aggregate existence checks to the injected `IWorkoutReferenceChecker` (implemented by `WorkoutWriteOnlyRepository`) — both wired into `RoutineBuilder`'s constructor.

## Validation

- `Name` required, unique per owner.
- At least one `RoutineEntry`.
- Each entry's `WorkoutId` must exist **and** belong to the same `OwnerId` as the Routine being created (checked via `IWorkoutReferenceChecker`, one call per distinct `WorkoutId` — duplicates in the entry list, per requirement #3, are allowed and only checked once).

## Persistence

`Routine` is a brand-new aggregate root (own table), `RoutineEntry` an EF `OwnsMany` collection (own table, shadow key + FK to `Routine.Id`) — identical mapping shape to `Workout`/`WorkoutExerciseEntry` from FT-001. No repository-tracking complications here (this is pure `Create`, same as FT-001 — `repository.Add(routine)` on a brand-new aggregate correctly cascades Added state to the whole graph).

## API surface

- `POST /api/routines/Create` — `CreateRoutineCommand { OwnerId, Name, Entries: [{ WorkoutId, DayOfWeek?, Sequence }] }` → 201.
- `GET /api/routines/GetAll` — `requestingUserId` required (same reasoning as `WorkoutsController.GetAll` — no shared-library fallback). Included for the same reason FT-001 included it: without it, there's no way to verify a Routine was actually created via the API surface at all. `RoutineQueryModel`, synced from `RoutineCreatedEvent` via a new `RoutineEventHandler`, same pattern as `WorkoutEventHandler`.

## Output

Handed to Backend Developer.
