# FT-001 — Workout Create

## Status

Built. Cleared to merge (pending: user adds/runs integration test coverage locally — Docker isn't available in this environment; see Review below).

## Requirements (Service Analyst)

### Source

Already decided centrally: `../product/domain-slice.md` → Workout; `Forma.Claude/docs/services/training-planning-service/domain.md`; `Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md` (versioning); `Forma.Claude/docs/architecture/adr/ADR-001-user-model-iteration-1.md` (single-owner scoping — "All domain data (Exercises, Workouts, Routines, Workout Sessions) is scoped to the single user who owns it"). No escalation needed.

### Functional requirements

1. A `Workout` is owned by exactly one user (`OwnerId`, required — unlike Exercise, there is no shared/private duality for Workout; ADR-001 scopes all Workout data to its single owning user, full stop).
2. Creating a Workout requires: `Name`, and an ordered sequence of **Workout Exercise entries** — each referencing an existing `Exercise` (by ID, `exercise-service`) with workout-specific parameters: `Sets`, `Reps` and/or `DurationSeconds` (a timed exercise may not have reps), `Weight` (optional), `RestSeconds` (optional), and its position in the sequence.
3. Grouping (supersets/circuits, named in `CLAUDE.md`'s product vision) — entries may share a `GroupId` to indicate they're performed back-to-back as a unit. Minimal support: allow the field, no validation of group structure beyond "entries with the same GroupId are adjacent in sequence" — building a richer grouping model isn't requested yet.
4. A newly created Workout has exactly one version (version 1) — see FT-002 for creating subsequent versions. Creation and "new version" are really the same underlying operation (append a version); FT-001 covers the first one, FT-002 covers the N+1 case explicitly since it's reached via a different entry point (editing an existing Workout) with different validation (the Workout must already exist).
5. A `Workout` referenced by name should probably be unique per owner — mirroring `exercise-service`'s Name-uniqueness-scoped-by-ownership pattern (`Forma.Exercise/docs/features/FT-001-ownership-visibility.md`), the closest precedent this codebase has for "same field, scoped by owner." Not explicitly stated centrally, but a reasonable default the Architect should confirm rather than skip past.

### Explicitly missing / flagged, not decided here

- **Exercise repeated within a Workout, and rest-time granularity** — still open centrally (`domain.md`/`open-questions.md` #2, #3). Default for this feature: **permit** repeats (each entry is independent, no uniqueness constraint on ExerciseId within a Workout) and **per-entry** rest time (not per-set) — the simpler of the two options, revisit if the central question resolves differently.
- **No real authentication** — same gap `exercise-service` had at its own Create feature (`Forma.Exercise/docs/features/FT-001-ownership-visibility.md`). `OwnerId` is caller-supplied for this iteration.
- **Existence validation of referenced Exercises** — this service has no access to `exercise-service`'s data (separate datastore, ADR-005) and no integration pattern is decided yet (`open-questions.md` #5). This feature **cannot** validate that a given `ExerciseId` actually exists — it can only store the ID. Flagged as a real gap, not solved here (same shape as `exercise-service`'s own "can't check Workout references before deleting an Exercise" gap, just the mirror image).

## Design (Service Architect)

### Aggregate boundary decision (resolves the question `Forma.Claude`'s architecture.md left open)

**Option A**: `Workout` is the sole aggregate root; `WorkoutVersion` is a child entity (own table, FK to `Workout.Id` — same shape as `exercise-service`'s `Exercise`/`ExerciseResource`), holding an ordered collection of `WorkoutExerciseEntry` (an **owned type**, no independent identity at all — matches the central decision that "Set" has no identity outside its parent).

Chosen over Option B (each version its own aggregate instance, mirroring `exercise-service`'s Exercise hierarchy) because a `WorkoutVersion` has no meaning detached from its `Workout` — unlike hierarchy parent/child Exercises, which are each independently owned/visible. One aggregate, one transaction boundary per Workout (across all its versions), matching how `Workout.RowVersion` optimistic concurrency should actually behave (concurrent edits to the *same* Workout should conflict; edits to different Workouts obviously shouldn't).

### Shape

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

### Uniqueness

`IWorkoutUniquenessChecker.IsUniqueAsync(name, ownerId)` — `Name` unique per owner. Simpler than `exercise-service`'s equivalent: `OwnerId` is always required here (never null), so there's no "shared scope" branch to handle — every check is scoped to exactly one owner.

### Builder / contract-injection pattern

Mirrors `IExerciseBuilder` exactly: `IWorkoutBuilder { Contracts _contracts; struct Contracts { IWorkoutUniquenessChecker uniquenessChecker; } }`, implemented by `WorkoutWriteOnlyRepository` (same class doing double duty as repository + checker, matching `ExerciseWriteOnlyRepository`'s precedent).

### Validation

- `Name` required, non-empty, unique per owner.
- At least one `WorkoutExerciseEntry`.
- Each entry: `Sets > 0`; at least one of `Reps`/`DurationSeconds` present (an entry needs *some* notion of "how much"). `ExerciseId` existence is **not** validated — this service can't reach `exercise-service`'s data (separate datastore, no integration pattern decided — see Requirements above).

### Anticipated for FT-002 (not built in this feature)

Creating a *new* version of an *existing* Workout will hit the same untracked-entity problem `exercise-service`'s `CreateExerciseResourceCommandHandler` did (`Forma.Exercise/docs/features/FT-002-exercise-hierarchy.md`, Review section, finding #2, later fixed via a dedicated child repository): loading `Workout` via `GetByIdAsync` returns it untracked, and `repository.Update(workout)`'s graph-walk would misclassify a new `WorkoutVersion` as Modified (if its key looks non-default) rather than Added. FT-002 will need its own `IWorkoutVersionWriteOnlyRepository` (mirroring `IExerciseResourceWriteOnlyRepository`) — not built here since FT-001's `Create` path uses `repository.Add(workout)` on a **brand-new** aggregate, where EF's `Add()` correctly cascades Added state to the whole graph regardless of key state (no ambiguity — only `Update()` on an *existing* root has the problem).

### API surface

- `POST /api/workouts/Create` — `CreateWorkoutCommand { OwnerId, Name, Exercises: [{ ExerciseId, Sets, Reps?, DurationSeconds?, Weight?, RestSeconds?, Sequence, GroupId? }] }` → 201 with the new `WorkoutId`.
- `GET /api/workouts/GetAll` — `requestingUserId` **required** query param (unlike `exercise-service`'s optional one — there's no shared-library fallback for Workout, an omitted owner would mean "return nothing," which isn't useful). Read side: `WorkoutQueryModel` (denormalized current-version snapshot), synced from `WorkoutCreatedEvent` via a new `WorkoutEventHandler`, matching `ExerciseEventHandler`'s pattern (including the earlier lesson: implement it as a plain non-generic class with closed `INotificationHandler<T>` interfaces, not the malformed open-generic-with-hardcoded-interface shape `exercise-service` had to fix).

## Review (Developer peer review + Service Architect conformance review)

### Conformance against Design

- `Workout` (aggregate root) + `WorkoutVersion` (child entity, own table, FK) + `WorkoutExerciseEntry` (owned type, no identity, EF `OwnsMany` to its own table with a shadow key) — matches the chosen Option A aggregate boundary exactly.
- `OwnerId` required (no shared/private duality) — matches ADR-001 scoping.
- `IWorkoutUniquenessChecker`/`IWorkoutBuilder` mirror `exercise-service`'s contract-injection pattern precisely.
- `POST /api/workouts/Create` + `GET /api/workouts/GetAll` (required `requestingUserId`, no optional shared-library fallback) — matches design.
- `WorkoutEventHandler` written as a proper non-generic class with closed `INotificationHandler<T>` interfaces from the start — avoids the malformed-open-generic bug `exercise-service`'s `ExerciseEventHandler<T>` had to be fixed after the fact.

### Verified

- `dotnet build` clean across `Forma.Planner.PublicApi` and `Forma.ArchitectureTests`.
- `Forma.ArchitectureTests` suite passes (1 test — generic scaffold convention test, not yet extended with a Workout-specific boundary guard; unlike `exercise-service`'s `ExerciseResource.Create`-is-internal test, `WorkoutVersion`/`WorkoutExerciseEntry` construction is already `internal`/private-constructor-only by design, just not test-guarded yet).
- EF Core migration (`InitialWorkout`) generated via `dotnet ef migrations add`, not hand-authored — `Up` creates `Workout`, `WorkoutVersion` (FK cascade), `WorkoutExerciseEntry` (owned, shadow int key + FK cascade), plus the two unique indexes (`Workout` per-owner name, `WorkoutVersion` per-workout version number).

### Findings

1. **Fixed a real bug found while generating the migration, unrelated to this feature's own code**: `ServicesCollectionExtensions.DbMigrationAssemblyName` was still hardcoded to the pre-rename `"Forma.PublicApi"` — the actual assembly is now `Forma.Planner.PublicApi` after the solution rename. This wasn't just a migration-tooling problem: `UseSqlServer(...).MigrationsAssembly(DbMigrationAssemblyName)` is real runtime configuration, so the app itself would have failed to find its migrations assembly at startup too. Fixed as part of this feature since nothing could be verified without it.
2. `Forma.ArchitectureTests`'s single test doesn't yet assert anything Workout-specific (e.g. that `WorkoutVersion`/`WorkoutExerciseEntry` can't be constructed from outside the aggregate). Not added in this pass — flagging for a follow-up, same tier as `exercise-service`'s equivalent guard.

### Not verified (environment gap, same as `exercise-service`'s sessions)

- No Docker here to run `Forma.IntegrationTests` against a real SQL Server / Mongo. No integration-test coverage exists yet for this feature. Flagging for the user to add coverage and run locally before merging.

## Central Architect Gate

*(`Forma.Claude`'s system-wide Architect — cross-service impact only, not a second local design/code-quality pass.)*

### Cross-service impact assessment

- `Workout.OwnerId` references `identity-service`'s `User` by ID only — same shape already anticipated centrally, no new contract.
- `WorkoutExerciseEntry.ExerciseId` references `exercise-service`'s `Exercise` by ID only, **unvalidated** (this service has no way to check the ID is real — separate datastore, no integration pattern decided). This is a known, explicitly-flagged gap (Requirements above), not a defect — resolving it is blocked on the same undecided integration-pattern question already tracked centrally.
- Resolves the aggregate-boundary open question `Forma.Claude`'s central architecture.md deliberately left open (Option A: one aggregate, embedded version history) — this is exactly the kind of local design decision the Service Architect is supposed to make; not promoted centrally as a new decision, but the central docs should be updated to reflect it's settled now.

**Verdict: no promotion of a new cross-service decision needed.**

### Central knowledge updated

- `Forma.Claude/docs/services/training-planning-service/architecture.md` — the Workout aggregate-boundary question is resolved (Option A), no longer open.
- `Forma.Claude/docs/services/training-planning-service/open-questions.md` — item 6 resolved.
