# FT-002 — Workout New Version — Central Architect Gate

## Cross-service impact assessment

Entirely intra-aggregate (`Workout`/`WorkoutVersion`) plus a generic, reusable repository-abstraction addition (`MarkModified`) local to this service's own `Forma.CoreInfrastructure`/`Forma.Infrastructure` layers. No new cross-service surface, no change to the `ExerciseId`-reference-is-unvalidated gap already tracked.

**Verdict: no promotion needed.**

## Central knowledge updated

- `Forma.Claude/docs/services/training-planning-service/domain.md` — Workout new-version capability now built.

## Output

Cleared to merge (pending: user verifies end-to-end locally — Docker isn't available in this environment).
