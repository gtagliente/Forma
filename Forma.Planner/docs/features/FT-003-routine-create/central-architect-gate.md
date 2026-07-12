# FT-003 — Routine Create — Central Architect Gate

## Cross-service impact assessment

- `Routine.OwnerId` references `identity-service`'s `User` by ID only — same anticipated shape, no new contract.
- `RoutineEntry.WorkoutId` references `Workout` — **intra-service**, not cross-service (both aggregates live in `training-planning-service`'s own datastore), so unlike `ExerciseId` this reference is fully validated (`IWorkoutReferenceChecker`). No cross-service concern here at all.
- The `DayOfWeek?` scheduling hint is a deliberately minimal placeholder, not a resolution of the still-open central scheduling-model question (`open-questions.md` #1) — flagged as provisional, same pattern as `exercise-service`'s hierarchy cross-visibility default.

**Verdict: no promotion needed.**

## Central knowledge updated

- `Forma.Claude/docs/services/training-planning-service/domain.md` — Routine create now built; all three of this session's requested features (Workout create, Workout new version, Routine create) are done.
- `Forma.Claude/docs/services/training-planning-service/open-questions.md` — item 1 (scheduling model) annotated with the provisional `DayOfWeek` placeholder now live in code, same "not a resolution" framing as the hierarchy precedent.

## Output

Cleared to merge (pending: user adds/runs integration test coverage locally — Docker isn't available in this environment).
