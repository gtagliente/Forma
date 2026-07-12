# FT-001 — Workout Create — Design

## Aggregate boundary decision (resolves the question `Forma.Claude`'s architecture.md left open)

**Option A**: `Workout` is the sole aggregate root; `WorkoutVersion` is a child entity (own table, FK to `Workout.Id` — same shape as `exercise-service`'s `Exercise`/`ExerciseResource`), holding an ordered collection of `WorkoutExerciseEntry` (an **owned type**, no independent identity at all — matches the central decision that "Set" has no identity outside its parent).

Chosen over Option B (each version its own aggregate instance, mirroring `exercise-service`'s Exercise hierarchy) because a `WorkoutVersion` has no meaning detached from its `Workout` — unlike hierarchy parent/child Exercises, which are each independently owned/visible. One aggregate, one transaction boundary per Workout (across all its versions), matching how `Workout.RowVersion` optimistic concurrency should actually behave (concurrent edits to the *same* Workout should conflict; edits to different Workouts obviously shouldn't).

## Shape

```
Workout (aggregate root, BaseEntity<WorkoutId>)
  OwnerId: Guid (required — no shared/private duality like Exercise; ADR-001 scopes all Workout data to its single owner)
  Name: string
  CurrentVersionNumber: int
  Versions: IReadOnlyCollection<WorkoutVersion>  (child entities, own table, FK WorkoutId)

WorkoutVersion (child entity, no own repository — see "Anticipated for FT-002" below)
  Id: WorkoutVersionId
  VersionNumber: int  (1, 2, 3... immutable once created)
  CreatedAt: DateTime
  Entries: IReadOnlyCollection<WorkoutExerciseEntry>  (owned type, no identity, EF-mapped to its own table with a shadow key)

WorkoutExerciseEntry (owned, no identity)
  ExerciseId: Guid  (exercise-service reference by ID only — not a local FK, separate datastore per ADR-005)
  Sets: int
  Reps: int?         (nullable — a timed exercise may have no rep count)
  DurationSeconds: int?
  Weight: decimal?
  RestSeconds: int?
  Sequence: int      (position within the version)
  GroupId: Guid?     (shared GroupId = performed as a superset/circuit; no structural validation beyond that)
```

## Uniqueness

`IWorkoutUniquenessChecker.IsUniqueAsync(name, ownerId)` — `Name` unique per owner. Simpler than `exercise-service`'s equivalent: `OwnerId` is always required here (never null), so there's no "shared scope" branch to handle — every check is scoped to exactly one owner.

## Builder / contract-injection pattern

Mirrors `IExerciseBuilder` exactly: `IWorkoutBuilder { Contracts _contracts; struct Contracts { IWorkoutUniquenessChecker uniquenessChecker; } }`, implemented by `WorkoutWriteOnlyRepository` (same class doing double duty as repository + checker, matching `ExerciseWriteOnlyRepository`'s precedent).

## Validation

- `Name` required, non-empty, unique per owner.
- At least one `WorkoutExerciseEntry`.
- Each entry: `Sets > 0`; at least one of `Reps`/`DurationSeconds` present (an entry needs *some* notion of "how much"). `ExerciseId` existence is **not** validated — this service can't reach `exercise-service`'s data (separate datastore, no integration pattern decided — see `requirements.md`).

## Anticipated for FT-002 (not built in this feature)

Creating a *new* version of an *existing* Workout will hit the same untracked-entity problem `exercise-service`'s `CreateExerciseResourceCommandHandler` did (`Forma.Exercise/docs/features/FT-002-exercise-hierarchy/review.md`, finding #2, later fixed via a dedicated child repository): loading `Workout` via `GetByIdAsync` returns it untracked, and `repository.Update(workout)`'s graph-walk would misclassify a new `WorkoutVersion` as Modified (if its key looks non-default) rather than Added. FT-002 will need its own `IWorkoutVersionWriteOnlyRepository` (mirroring `IExerciseResourceWriteOnlyRepository`) — not built here since FT-001's `Create` path uses `repository.Add(workout)` on a **brand-new** aggregate, where EF's `Add()` correctly cascades Added state to the whole graph regardless of key state (no ambiguity — only `Update()` on an *existing* root has the problem).

## API surface

- `POST /api/workouts/Create` — `CreateWorkoutCommand { OwnerId, Name, Exercises: [{ ExerciseId, Sets, Reps?, DurationSeconds?, Weight?, RestSeconds?, Sequence, GroupId? }] }` → 201 with the new `WorkoutId`.
- `GET /api/workouts/GetAll` — `requestingUserId` **required** query param (unlike `exercise-service`'s optional one — there's no shared-library fallback for Workout, an omitted owner would mean "return nothing," which isn't useful). Read side: `WorkoutQueryModel` (denormalized current-version snapshot), synced from `WorkoutCreatedEvent` via a new `WorkoutEventHandler`, matching `ExerciseEventHandler`'s pattern (including the earlier lesson: implement it as a plain non-generic class with closed `INotificationHandler<T>` interfaces, not the malformed open-generic-with-hardcoded-interface shape `exercise-service` had to fix).

## Output

Handed to Backend Developer.
