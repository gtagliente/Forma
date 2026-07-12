# FT-003 — Routine Create — Review

## Stages

Developer peer review + Service Architect conformance review, done together.

## Conformance against `design.md`

- `Routine` (aggregate root) + `RoutineEntry` (owned type, own table, `WorkoutId`/`DayOfWeek`/`Sequence`) — matches the designed shape exactly, same `OwnsMany` pattern as `Workout`/`WorkoutExerciseEntry`.
- `IWorkoutReferenceChecker` implemented by the **existing** `WorkoutWriteOnlyRepository` (one more method, same class already doing double duty for `IWorkoutUniquenessChecker`) — matches the cross-aggregate-checker precedent named in the design.
- Existence check only runs once per **distinct** `WorkoutId` (`.Distinct()` before checking) — correctly matches requirement #3 (a Routine may reference the same Workout more than once without redundant checks or false rejections).
- `IRoutineBuilder`/`RoutineBuilder` carry both checkers, mirrors `IWorkoutBuilder`/`IWorkoutUniquenessChecker`-alone shape, extended for the second contract.
- `POST /api/routines/Create` + `GET /api/routines/GetAll` (required `requestingUserId`) — matches design, same reasoning as `WorkoutsController`.
- Pure `Create` on a brand-new aggregate — `repository.Add(routine)` cascades correctly, no untracked-entity complications (same as FT-001, unlike FT-002).

## Verified

- `dotnet build` clean.
- `Forma.ArchitectureTests` suite passes.
- EF Core migration (`InitialRoutine`) generated via `dotnet ef migrations add` — `Up` creates `Routine` + `RoutineEntry` (owned, shadow int key + FK cascade) + the per-owner name uniqueness index. `WorkoutId` stored as a scalar `uniqueidentifier` column on `RoutineEntry` (no FK constraint to `Workout` — deliberate: it's a reference by identity, not a relational join, matching how `ExerciseId` is stored as a scalar on `WorkoutExerciseEntry` in FT-001).

## Findings

None blocking.

## Not verified (environment gap, carried from FT-001/FT-002)

No Docker here to run `Forma.IntegrationTests`. No integration-test coverage exists yet for any of the three features built this session. Flagging for the user to add coverage and run locally before merging — same standing note as FT-001/FT-002.

## Output

Ready for Central Architect gate.
