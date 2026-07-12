# FT-001 — Workout Create — Central Architect Gate

## Cross-service impact assessment

- `Workout.OwnerId` references `identity-service`'s `User` by ID only — same shape already anticipated centrally, no new contract.
- `WorkoutExerciseEntry.ExerciseId` references `exercise-service`'s `Exercise` by ID only, **unvalidated** (this service has no way to check the ID is real — separate datastore, no integration pattern decided). This is a known, explicitly-flagged gap (`requirements.md`), not a defect — resolving it is blocked on the same undecided integration-pattern question already tracked centrally.
- Resolves the aggregate-boundary open question `Forma.Claude`'s central architecture.md deliberately left open (Option A: one aggregate, embedded version history) — this is exactly the kind of local design decision the Service Architect is supposed to make; not promoted centrally as a new decision, but the central docs should be updated to reflect it's settled now.

**Verdict: no promotion of a new cross-service decision needed.**

## Central knowledge updated

- `Forma.Claude/docs/services/training-planning-service/architecture.md` — the Workout aggregate-boundary question is resolved (Option A), no longer open.
- `Forma.Claude/docs/services/training-planning-service/open-questions.md` — item 6 resolved.

## Output

Cleared to merge (pending: user adds/runs integration test coverage locally — Docker isn't available in this environment).
