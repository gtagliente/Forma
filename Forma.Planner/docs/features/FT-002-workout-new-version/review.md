# FT-002 — Workout New Version — Review

## Stages

Developer peer review + Service Architect conformance review, done together.

## Conformance against `design.md`

- `WorkoutVersion` now implements `IEntity<WorkoutVersionId>`; new `IWorkoutVersionWriteOnlyRepository<TEntity,TKey>` + `WorkoutVersionWriteOnlyRepository` (one-liner) mirror the anticipated shape exactly.
- `Workout.AddNewVersion(...)` reuses `WorkoutVersion.Create` directly (same validation, no duplication), raises `WorkoutVersionCreatedEvent`, no `IWorkoutBuilder` needed (no uniqueness check applies).
- Ownership check done at the Application layer via `Result.Forbidden()`, not a domain exception — matches the design's reasoning (access control, not a domain rule).
- `WorkoutEventHandler` extended with a second `Handle` overload for `WorkoutVersionCreatedEvent` — same non-generic multi-interface shape as FT-001, no regression to the malformed-generic pattern.
- `POST /api/workouts/AddNewVersion` — 200/403/404/400 as designed.

## Finding beyond the design note, resolved during implementation

`design.md` correctly anticipated the child-entity tracking problem (dedicated `IWorkoutVersionWriteOnlyRepository`) but didn't fully work through a second, related problem: `Workout.CurrentVersionNumber` also changes on the **root** in this feature (unlike FT-001, where the root was brand new). Loaded-untracked-then-`Update()`'d would hit the *same* misclassification problem in reverse — `Update(workout)`'s whole-graph walk would also touch the now-freshly-appended `WorkoutVersion` in `workout.Versions` (since `AddNewVersion` mutates the same in-memory `Versions` collection before persistence) and misclassify it, on top of double-tracking it against the separate `workoutVersionRepository.Add(newVersion)` call — likely surfacing as an EF Core "entity already tracked with a different state" exception at runtime.

Fixed by adding a small, reusable capability to the **shared generic base** (`IWriteOnlyRepository<TEntity,TKey>.MarkModified<TProperty>`, implemented once in `BaseWriteOnlyRepository` via `DbContext.Entry(entity).Property(...).IsModified = true`) — `Entry()` tracks only the single entity passed to it, never cascading into navigation collections the way `Add`/`Update`/`Attach` do, so it can mark exactly one scalar dirty without touching `Versions` at all. This benefits any future aggregate with the same "root's own scalar changes alongside a separately-tracked new child" shape, not just Workout.

## Verified

- `dotnet build` clean.
- `Forma.ArchitectureTests` suite passes.
- No EF migration needed — `IEntity<WorkoutVersionId>` is a pure C# interface addition (`WorkoutVersion`'s EF mapping was already fully explicit in `WorkoutVersionConfiguration`, not reflection/interface-driven), and `MarkModified` is pure runtime change-tracking behavior, no schema change.

## Not verified (environment gap, carried from FT-001)

No Docker here to exercise this end-to-end against a real database — the `MarkModified`/dedicated-child-repository reasoning above is sound EF Core behavior (documented `DbContext.Entry()` semantics: single-entity tracking, no graph cascade), but hasn't been empirically run. Flagging for the user to verify with a real create → add-version → confirm both the new row and the bumped `CurrentVersionNumber` round-trip.

## Output

Ready for Central Architect gate.
