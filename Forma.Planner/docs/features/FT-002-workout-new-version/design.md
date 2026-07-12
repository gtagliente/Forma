# FT-002 — Workout New Version — Design

## Repository shape (anticipated in FT-001, built now)

Loading `Workout` via `GetByIdAsync` returns it **untracked** (`AsNoTrackingWithIdentityResolution`), and `WorkoutVersion.Id` is a client-generated key (always non-default) — so `repository.Update(workout)` would misclassify the new `WorkoutVersion` as Modified instead of Added, the exact bug `exercise-service` hit and fixed via a dedicated child repository (`Forma.Exercise/docs/features/FT-002-exercise-hierarchy/review.md` → `Forma.Exercise/docs/features/...` untracked-entity fix). Same fix applied here from the start:

- `WorkoutVersion` now implements `IEntity<WorkoutVersionId>` (previously implemented nothing — needed for `BaseWriteOnlyRepository<TEntity,TKey>`'s generic constraint).
- New `IWorkoutVersionWriteOnlyRepository<TEntity, TKey> : IWriteOnlyRepository<TEntity, TKey>` (generic, `Forma.CoreInfrastructure.Abstractions` — same layering reason `IWorkoutWriteOnlyRepository` stays generic there).
- New `WorkoutVersionWriteOnlyRepository : BaseWriteOnlyRepository<WorkoutVersion, WorkoutVersionId>` — one-liner, inherits `Add`/`Update`/`Remove`/`GetByIdAsync` for free, same shape as `ExerciseResourceWriteOnlyRepository`.
- Handler calls `workoutVersionRepository.Add(newVersion)` directly — unconditional Added tracking, no graph-walk ambiguity.

## Domain method

`Workout.AddNewVersion(IEnumerable<(...)> exercises)` — no `IWorkoutBuilder`/uniqueness checker needed (unlike `Create`, nothing here is name-scoped). Validates entries via the same rules as `WorkoutVersion.Create` (reused directly — `WorkoutVersion.Create(WorkoutId, VersionNumber, exercises)` already does this), appends the new version to `_versions`, bumps `CurrentVersionNumber`, raises `WorkoutVersionCreatedEvent` (new event, mirrors `WorkoutCreatedEvent`'s shape for read-model projection).

## Ownership check

Not a domain rule (no `DomainArgumentException`) — an access-control concern, handled at the Application layer: load the `Workout`, compare `request.OwnerId` against `workout.OwnerId`, return `Result.Forbidden()` (already handled by `ResultExtensions.ToHttpNonSuccessResult` → `403`) on mismatch, before calling the domain method at all.

## Read side

`WorkoutVersionCreatedEvent` handled by `WorkoutEventHandler` (extended with a second `Handle` overload, same non-generic multi-interface shape as FT-001) — upserts `WorkoutQueryModel` with the new `CurrentVersionNumber`/`Exercises` snapshot, same `UpsertAsync` pattern as Created (overwrites the whole document — there's no history projection since no read feature for history is requested, per `requirements.md`).

## API surface

`POST /api/workouts/AddNewVersion` — `AddWorkoutVersionCommand { WorkoutId, OwnerId, Exercises: [...] }` → 200 on success (not 201 — it's not creating a new top-level resource, it's mutating an existing Workout's state), 403 on ownership mismatch, 404 if the Workout doesn't exist, 400 on validation.

## Output

Handed to Backend Developer.
