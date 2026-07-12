# FT-001 — Workout Create — Service Analyst Requirements

## Source

Already decided centrally: `../../product/domain-slice.md` → Workout; `Forma.Claude/docs/services/training-planning-service/domain.md`; `Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md` (versioning); `Forma.Claude/docs/architecture/adr/ADR-001-user-model-iteration-1.md` (single-owner scoping — "All domain data (Exercises, Workouts, Routines, Workout Sessions) is scoped to the single user who owns it"). No escalation needed.

## Functional requirements

1. A `Workout` is owned by exactly one user (`OwnerId`, required — unlike Exercise, there is no shared/private duality for Workout; ADR-001 scopes all Workout data to its single owning user, full stop).
2. Creating a Workout requires: `Name`, and an ordered sequence of **Workout Exercise entries** — each referencing an existing `Exercise` (by ID, `exercise-service`) with workout-specific parameters: `Sets`, `Reps` and/or `DurationSeconds` (a timed exercise may not have reps), `Weight` (optional), `RestSeconds` (optional), and its position in the sequence.
3. Grouping (supersets/circuits, named in `CLAUDE.md`'s product vision) — entries may share a `GroupId` to indicate they're performed back-to-back as a unit. Minimal support: allow the field, no validation of group structure beyond "entries with the same GroupId are adjacent in sequence" — building a richer grouping model isn't requested yet.
4. A newly created Workout has exactly one version (version 1) — see FT-002 for creating subsequent versions. Creation and "new version" are really the same underlying operation (append a version); FT-001 covers the first one, FT-002 covers the N+1 case explicitly since it's reached via a different entry point (editing an existing Workout) with different validation (the Workout must already exist).
5. A `Workout` referenced by name should probably be unique per owner — mirroring `exercise-service`'s Name-uniqueness-scoped-by-ownership pattern (`Forma.Exercise/docs/features/FT-001-ownership-visibility/`), the closest precedent this codebase has for "same field, scoped by owner." Not explicitly stated centrally, but a reasonable default the Architect should confirm rather than skip past.

## Explicitly missing / flagged, not decided here

- **Exercise repeated within a Workout, and rest-time granularity** — still open centrally (`domain.md`/`open-questions.md` #2, #3). Default for this feature: **permit** repeats (each entry is independent, no uniqueness constraint on ExerciseId within a Workout) and **per-entry** rest time (not per-set) — the simpler of the two options, revisit if the central question resolves differently.
- **No real authentication** — same gap `exercise-service` had at its own Create feature (`Forma.Exercise/docs/features/FT-001-ownership-visibility/requirements.md`). `OwnerId` is caller-supplied for this iteration.
- **Existence validation of referenced Exercises** — this service has no access to `exercise-service`'s data (separate datastore, ADR-005) and no integration pattern is decided yet (`open-questions.md` #5). This feature **cannot** validate that a given `ExerciseId` actually exists — it can only store the ID. Flagged as a real gap, not solved here (same shape as `exercise-service`'s own "can't check Workout references before deleting an Exercise" gap, just the mirror image).

## Output

Handed to Service Architect for design (`design.md` in this folder) — including the aggregate-boundary decision `Forma.Claude`'s central architecture.md deliberately left open.
