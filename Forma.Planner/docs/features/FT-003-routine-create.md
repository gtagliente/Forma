# FT-003 — Routine Create

## Status

Built. Cleared to merge (pending: user adds/runs integration test coverage locally — Docker isn't available in this environment; see Review below).

## Requirements (Service Analyst)

### Source

Already decided centrally: `../product/domain-slice.md` → Routine; `Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md` (Routine references a Workout live, always latest version — never pinned); ADR-001 (Routine data scoped to a single owning user, same as Workout). No escalation needed.

### Functional requirements

1. A `Routine` is owned by exactly one user (`OwnerId`, required — same as Workout, no shared/private duality).
2. Creating a Routine requires: `Name`, and an ordered collection of **Routine entries**, each referencing exactly one existing `WorkoutId` by identity — **never** duplicating or snapshotting the Workout's content (ADR-002: Routine always resolves to whichever version is current *at the time it's read*, not a version pinned at Routine-creation time).
3. A Routine may reference the **same Workout more than once** (e.g. "Upper Body" on both Monday and Friday) — no uniqueness constraint across entries.
4. `Name` unique per owner, mirroring Workout's own uniqueness scoping (`docs/features/FT-001-workout-create.md`).

### Explicitly missing / flagged, not decided here

- **Full scheduling model is still an open central question** (recurring pattern vs. calendar dates vs. both — `Forma.Claude/docs/services/training-planning-service/open-questions.md` #1). This feature does **not** attempt to resolve it. Minimal placeholder: each entry may optionally carry a `DayOfWeek` (nullable) as a lightweight recurring-style hint — enough to satisfy "organize workouts... when, how often" without committing to a full calendar/recurrence engine nobody has asked for yet. A Routine with no `DayOfWeek` on any entry is still valid — it's just an ordered list of Workouts with no day assignment.
- **Workout existence validation** — same shape as FT-001's Exercise-existence gap, except this time the reference target (`Workout`) **is** owned by this same service/datastore, so it actually **can** be validated (unlike `ExerciseId`, which lives in a separate service). This feature **does** validate that each referenced `WorkoutId` exists and belongs to the same `OwnerId` as the Routine (a Routine referencing another user's Workout makes no sense under the single-owner model).
- **No real authentication** — same caller-supplied-`OwnerId` gap as FT-001/FT-002.
- **No Update/Delete for Routine** — not requested, matching this session's scope (Create only, across all three features).

## Design (Service Architect)

### Shape

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

### Cross-aggregate validation: does the Workout exist and belong to this owner?

Unlike FT-001's `ExerciseId` reference (unvalidatable — separate service/datastore), `WorkoutId` **is** owned by this same service, so this feature validates it — matching Requirements above. New Domain-layer contract, mirroring the existing `IWorkoutUniquenessChecker` pattern:

```csharp
// Forma.Domain.Entities.RoutineAggregate.Contracts
public interface IWorkoutReferenceChecker
{
    Task<bool> ExistsForOwnerAsync(WorkoutId workoutId, Guid ownerId);
}
```

Implemented by the **existing** `WorkoutWriteOnlyRepository` (already has `DbContext.Set<Workout>()` access, already does double duty as repository + checker for `IWorkoutUniquenessChecker`) — one more method, same class, same cross-aggregate-checker precedent `exercise-service` used for `IExerciseResourceLinkUniquenessChecker` living alongside `IExerciseUniquenessChecker` on one repository.

### Uniqueness & builder

`IRoutineUniquenessChecker.IsUniqueAsync(name, ownerId)` and `IRoutineBuilder` mirror `IWorkoutUniquenessChecker`/`IWorkoutBuilder` exactly, except `IRoutineBuilder.Contracts` carries **two** checkers (uniqueness + the new workout-reference checker), implemented by a new `RoutineWriteOnlyRepository` (uniqueness) delegating cross-aggregate existence checks to the injected `IWorkoutReferenceChecker` (implemented by `WorkoutWriteOnlyRepository`) — both wired into `RoutineBuilder`'s constructor.

### Validation

- `Name` required, unique per owner.
- At least one `RoutineEntry`.
- Each entry's `WorkoutId` must exist **and** belong to the same `OwnerId` as the Routine being created (checked via `IWorkoutReferenceChecker`, one call per distinct `WorkoutId` — duplicates in the entry list, per requirement #3, are allowed and only checked once).

### Persistence

`Routine` is a brand-new aggregate root (own table), `RoutineEntry` an EF `OwnsMany` collection (own table, shadow key + FK to `Routine.Id`) — identical mapping shape to `Workout`/`WorkoutExerciseEntry` from FT-001. No repository-tracking complications here (this is pure `Create`, same as FT-001 — `repository.Add(routine)` on a brand-new aggregate correctly cascades Added state to the whole graph).

### API surface

- `POST /api/routines/Create` — `CreateRoutineCommand { OwnerId, Name, Entries: [{ WorkoutId, DayOfWeek?, Sequence }] }` → 201.
- `GET /api/routines/GetAll` — `requestingUserId` required (same reasoning as `WorkoutsController.GetAll` — no shared-library fallback). Included for the same reason FT-001 included it: without it, there's no way to verify a Routine was actually created via the API surface at all. `RoutineQueryModel`, synced from `RoutineCreatedEvent` via a new `RoutineEventHandler`, same pattern as `WorkoutEventHandler`.

## Review (Developer peer review + Service Architect conformance review)

### Conformance against Design

- `Routine` (aggregate root) + `RoutineEntry` (owned type, own table, `WorkoutId`/`DayOfWeek`/`Sequence`) — matches the designed shape exactly, same `OwnsMany` pattern as `Workout`/`WorkoutExerciseEntry`.
- `IWorkoutReferenceChecker` implemented by the **existing** `WorkoutWriteOnlyRepository` (one more method, same class already doing double duty for `IWorkoutUniquenessChecker`) — matches the cross-aggregate-checker precedent named in the design.
- Existence check only runs once per **distinct** `WorkoutId` (`.Distinct()` before checking) — correctly matches requirement #3 (a Routine may reference the same Workout more than once without redundant checks or false rejections).
- `IRoutineBuilder`/`RoutineBuilder` carry both checkers, mirrors `IWorkoutBuilder`/`IWorkoutUniquenessChecker`-alone shape, extended for the second contract.
- `POST /api/routines/Create` + `GET /api/routines/GetAll` (required `requestingUserId`) — matches design, same reasoning as `WorkoutsController`.
- Pure `Create` on a brand-new aggregate — `repository.Add(routine)` cascades correctly, no untracked-entity complications (same as FT-001, unlike FT-002).

### Verified

- `dotnet build` clean.
- `Forma.ArchitectureTests` suite passes.
- EF Core migration (`InitialRoutine`) generated via `dotnet ef migrations add` — `Up` creates `Routine` + `RoutineEntry` (owned, shadow int key + FK cascade) + the per-owner name uniqueness index. `WorkoutId` stored as a scalar `uniqueidentifier` column on `RoutineEntry` (no FK constraint to `Workout` — deliberate: it's a reference by identity, not a relational join, matching how `ExerciseId` is stored as a scalar on `WorkoutExerciseEntry` in FT-001).

### Findings

None blocking.

### Not verified (environment gap, carried from FT-001/FT-002)

No Docker here to run `Forma.IntegrationTests`. No integration-test coverage exists yet for any of the three features built this session. Flagging for the user to add coverage and run locally before merging — same standing note as FT-001/FT-002.

## Central Architect Gate

*(`Forma.Claude`'s system-wide Architect — cross-service impact only, not a second local design/code-quality pass.)*

### Cross-service impact assessment

- `Routine.OwnerId` references `identity-service`'s `User` by ID only — same anticipated shape, no new contract.
- `RoutineEntry.WorkoutId` references `Workout` — **intra-service**, not cross-service (both aggregates live in `training-planning-service`'s own datastore), so unlike `ExerciseId` this reference is fully validated (`IWorkoutReferenceChecker`). No cross-service concern here at all.
- The `DayOfWeek?` scheduling hint is a deliberately minimal placeholder, not a resolution of the still-open central scheduling-model question (`open-questions.md` #1) — flagged as provisional, same pattern as `exercise-service`'s hierarchy cross-visibility default.

**Verdict: no promotion needed.**

### Central knowledge updated

- `Forma.Claude/docs/services/training-planning-service/domain.md` — Routine create now built; all three of this session's requested features (Workout create, Workout new version, Routine create) are done.
- `Forma.Claude/docs/services/training-planning-service/open-questions.md` — item 1 (scheduling model) annotated with the provisional `DayOfWeek` placeholder now live in code, same "not a resolution" framing as the hierarchy precedent.
