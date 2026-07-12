# FT-002 — Workout New Version

## Status

Built. Cleared to merge (pending: user verifies end-to-end locally — Docker isn't available in this environment; see Review below).

## Requirements (Service Analyst)

### Source

Already decided centrally: `Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md` ("editing a Workout's structure or parameters creates a new immutable version rather than mutating the existing one in place"). Builds directly on FT-001's aggregate shape. No escalation needed.

### Functional requirements

1. Given an existing `WorkoutId`, create a **new** `WorkoutVersion` with `VersionNumber = CurrentVersionNumber + 1`, and update `Workout.CurrentVersionNumber` to point at it. Prior versions are never modified or removed — they remain queryable as history (no read feature for history is requested yet, but nothing about this feature should make history unrecoverable).
2. The caller supplies the **complete** new exercise list for the new version (not a partial patch/diff against the previous version) — same shape as FT-001's `Exercises` list. Simpler to reason about and matches "new version = new immutable snapshot," not an incremental edit.
3. Only the Workout's owner may create a new version of it — `OwnerId` supplied by the caller must match `Workout.OwnerId` (same no-real-auth caveat as FT-001; this is caller-supplied, not derived from a validated identity).
4. Same entry-level validation as FT-001 (at least one entry, `Sets > 0`, at least one of `Reps`/`DurationSeconds`).

### Explicitly missing / flagged, not decided here

- **No endpoint to read version history** (list all versions of a Workout, or fetch a specific past version) — not requested. The data is preserved (requirement 1), but nothing exposes it yet.
- **No real authentication** — same gap as FT-001.
- **Exercise existence validation** — same gap as FT-001, unchanged.

## Design (Service Architect)

### Repository shape (anticipated in FT-001, built now)

Loading `Workout` via `GetByIdAsync` returns it **untracked** (`AsNoTrackingWithIdentityResolution`), and `WorkoutVersion.Id` is a client-generated key (always non-default) — so `repository.Update(workout)` would misclassify the new `WorkoutVersion` as Modified instead of Added, the exact bug `exercise-service` hit and fixed via a dedicated child repository (`Forma.Exercise/docs/features/FT-002-exercise-hierarchy.md`, Review section — the untracked-entity fix). Same fix applied here from the start:

- `WorkoutVersion` now implements `IEntity<WorkoutVersionId>` (previously implemented nothing — needed for `BaseWriteOnlyRepository<TEntity,TKey>`'s generic constraint).
- New `IWorkoutVersionWriteOnlyRepository<TEntity, TKey> : IWriteOnlyRepository<TEntity, TKey>` (generic, `Forma.CoreInfrastructure.Abstractions` — same layering reason `IWorkoutWriteOnlyRepository` stays generic there).
- New `WorkoutVersionWriteOnlyRepository : BaseWriteOnlyRepository<WorkoutVersion, WorkoutVersionId>` — one-liner, inherits `Add`/`Update`/`Remove`/`GetByIdAsync` for free, same shape as `ExerciseResourceWriteOnlyRepository`.
- Handler calls `workoutVersionRepository.Add(newVersion)` directly — unconditional Added tracking, no graph-walk ambiguity.

### Domain method

`Workout.AddNewVersion(IEnumerable<(...)> exercises)` — no `IWorkoutBuilder`/uniqueness checker needed (unlike `Create`, nothing here is name-scoped). Validates entries via the same rules as `WorkoutVersion.Create` (reused directly — `WorkoutVersion.Create(WorkoutId, VersionNumber, exercises)` already does this), appends the new version to `_versions`, bumps `CurrentVersionNumber`, raises `WorkoutVersionCreatedEvent` (new event, mirrors `WorkoutCreatedEvent`'s shape for read-model projection).

### Ownership check

Not a domain rule (no `DomainArgumentException`) — an access-control concern, handled at the Application layer: load the `Workout`, compare `request.OwnerId` against `workout.OwnerId`, return `Result.Forbidden()` (already handled by `ResultExtensions.ToHttpNonSuccessResult` → `403`) on mismatch, before calling the domain method at all.

### Read side

`WorkoutVersionCreatedEvent` handled by `WorkoutEventHandler` (extended with a second `Handle` overload, same non-generic multi-interface shape as FT-001) — upserts `WorkoutQueryModel` with the new `CurrentVersionNumber`/`Exercises` snapshot, same `UpsertAsync` pattern as Created (overwrites the whole document — there's no history projection since no read feature for history is requested, per Requirements above).

### API surface

`POST /api/workouts/AddNewVersion` — `AddWorkoutVersionCommand { WorkoutId, OwnerId, Exercises: [...] }` → 200 on success (not 201 — it's not creating a new top-level resource, it's mutating an existing Workout's state), 403 on ownership mismatch, 404 if the Workout doesn't exist, 400 on validation.

## Review (Developer peer review + Service Architect conformance review)

### Conformance against Design

- `WorkoutVersion` now implements `IEntity<WorkoutVersionId>`; new `IWorkoutVersionWriteOnlyRepository<TEntity,TKey>` + `WorkoutVersionWriteOnlyRepository` (one-liner) mirror the anticipated shape exactly.
- `Workout.AddNewVersion(...)` reuses `WorkoutVersion.Create` directly (same validation, no duplication), raises `WorkoutVersionCreatedEvent`, no `IWorkoutBuilder` needed (no uniqueness check applies).
- Ownership check done at the Application layer via `Result.Forbidden()`, not a domain exception — matches the design's reasoning (access control, not a domain rule).
- `WorkoutEventHandler` extended with a second `Handle` overload for `WorkoutVersionCreatedEvent` — same non-generic multi-interface shape as FT-001, no regression to the malformed-generic pattern.
- `POST /api/workouts/AddNewVersion` — 200/403/404/400 as designed.

### Finding beyond the design note, resolved during implementation

Design correctly anticipated the child-entity tracking problem (dedicated `IWorkoutVersionWriteOnlyRepository`) but didn't fully work through a second, related problem: `Workout.CurrentVersionNumber` also changes on the **root** in this feature (unlike FT-001, where the root was brand new). Loaded-untracked-then-`Update()`'d would hit the *same* misclassification problem in reverse — `Update(workout)`'s whole-graph walk would also touch the now-freshly-appended `WorkoutVersion` in `workout.Versions` (since `AddNewVersion` mutates the same in-memory `Versions` collection before persistence) and misclassify it, on top of double-tracking it against the separate `workoutVersionRepository.Add(newVersion)` call — likely surfacing as an EF Core "entity already tracked with a different state" exception at runtime.

Fixed by adding a small, reusable capability to the **shared generic base** (`IWriteOnlyRepository<TEntity,TKey>.MarkModified<TProperty>`, implemented once in `BaseWriteOnlyRepository` via `DbContext.Entry(entity).Property(...).IsModified = true`) — `Entry()` tracks only the single entity passed to it, never cascading into navigation collections the way `Add`/`Update`/`Attach` do, so it can mark exactly one scalar dirty without touching `Versions` at all. This benefits any future aggregate with the same "root's own scalar changes alongside a separately-tracked new child" shape, not just Workout.

### Verified

- `dotnet build` clean.
- `Forma.ArchitectureTests` suite passes.
- No EF migration needed — `IEntity<WorkoutVersionId>` is a pure C# interface addition (`WorkoutVersion`'s EF mapping was already fully explicit in `WorkoutVersionConfiguration`, not reflection/interface-driven), and `MarkModified` is pure runtime change-tracking behavior, no schema change.

### Not verified (environment gap, carried from FT-001)

No Docker here to exercise this end-to-end against a real database — the `MarkModified`/dedicated-child-repository reasoning above is sound EF Core behavior (documented `DbContext.Entry()` semantics: single-entity tracking, no graph cascade), but hasn't been empirically run. Flagging for the user to verify with a real create → add-version → confirm both the new row and the bumped `CurrentVersionNumber` round-trip.

## Central Architect Gate

*(`Forma.Claude`'s system-wide Architect — cross-service impact only, not a second local design/code-quality pass.)*

### Cross-service impact assessment

Entirely intra-aggregate (`Workout`/`WorkoutVersion`) plus a generic, reusable repository-abstraction addition (`MarkModified`) local to this service's own `Forma.CoreInfrastructure`/`Forma.Infrastructure` layers. No new cross-service surface, no change to the `ExerciseId`-reference-is-unvalidated gap already tracked.

**Verdict: no promotion needed.**

### Central knowledge updated

- `Forma.Claude/docs/services/training-planning-service/domain.md` — Workout new-version capability now built.
