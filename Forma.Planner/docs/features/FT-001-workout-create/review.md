# FT-001 — Workout Create — Review

## Stages

Developer peer review + Service Architect conformance review, done together.

## Conformance against `design.md`

- `Workout` (aggregate root) + `WorkoutVersion` (child entity, own table, FK) + `WorkoutExerciseEntry` (owned type, no identity, EF `OwnsMany` to its own table with a shadow key) — matches the chosen Option A aggregate boundary exactly.
- `OwnerId` required (no shared/private duality) — matches ADR-001 scoping.
- `IWorkoutUniquenessChecker`/`IWorkoutBuilder` mirror `exercise-service`'s contract-injection pattern precisely.
- `POST /api/workouts/Create` + `GET /api/workouts/GetAll` (required `requestingUserId`, no optional shared-library fallback) — matches design.
- `WorkoutEventHandler` written as a proper non-generic class with closed `INotificationHandler<T>` interfaces from the start — avoids the malformed-open-generic bug `exercise-service`'s `ExerciseEventHandler<T>` had to be fixed after the fact.

## Verified

- `dotnet build` clean across `Forma.Planner.PublicApi` and `Forma.ArchitectureTests`.
- `Forma.ArchitectureTests` suite passes (1 test — generic scaffold convention test, not yet extended with a Workout-specific boundary guard; unlike `exercise-service`'s `ExerciseResource.Create`-is-internal test, `WorkoutVersion`/`WorkoutExerciseEntry` construction is already `internal`/private-constructor-only by design, just not test-guarded yet).
- EF Core migration (`InitialWorkout`) generated via `dotnet ef migrations add`, not hand-authored — `Up` creates `Workout`, `WorkoutVersion` (FK cascade), `WorkoutExerciseEntry` (owned, shadow int key + FK cascade), plus the two unique indexes (`Workout` per-owner name, `WorkoutVersion` per-workout version number).

## Findings

1. **Fixed a real bug found while generating the migration, unrelated to this feature's own code**: `ServicesCollectionExtensions.DbMigrationAssemblyName` was still hardcoded to the pre-rename `"Forma.PublicApi"` — the actual assembly is now `Forma.Planner.PublicApi` after the solution rename. This wasn't just a migration-tooling problem: `UseSqlServer(...).MigrationsAssembly(DbMigrationAssemblyName)` is real runtime configuration, so the app itself would have failed to find its migrations assembly at startup too. Fixed as part of this feature since nothing could be verified without it.
2. `Forma.ArchitectureTests`'s single test doesn't yet assert anything Workout-specific (e.g. that `WorkoutVersion`/`WorkoutExerciseEntry` can't be constructed from outside the aggregate). Not added in this pass — flagging for a follow-up, same tier as `exercise-service`'s equivalent guard.

## Not verified (environment gap, same as `exercise-service`'s sessions)

- No Docker here to run `Forma.IntegrationTests` against a real SQL Server / Mongo. No integration-test coverage exists yet for this feature. Flagging for the user to add coverage and run locally before merging.

## Output

Ready for Central Architect gate.
