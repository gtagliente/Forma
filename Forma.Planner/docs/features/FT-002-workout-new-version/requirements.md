# FT-002 — Workout New Version — Service Analyst Requirements

## Source

Already decided centrally: [ADR-002](../../../../Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md) ("editing a Workout's structure or parameters creates a new immutable version rather than mutating the existing one in place"). Builds directly on FT-001's aggregate shape. No escalation needed.

## Functional requirements

1. Given an existing `WorkoutId`, create a **new** `WorkoutVersion` with `VersionNumber = CurrentVersionNumber + 1`, and update `Workout.CurrentVersionNumber` to point at it. Prior versions are never modified or removed — they remain queryable as history (no read feature for history is requested yet, but nothing about this feature should make history unrecoverable).
2. The caller supplies the **complete** new exercise list for the new version (not a partial patch/diff against the previous version) — same shape as FT-001's `Exercises` list. Simpler to reason about and matches "new version = new immutable snapshot," not an incremental edit.
3. Only the Workout's owner may create a new version of it — `OwnerId` supplied by the caller must match `Workout.OwnerId` (same no-real-auth caveat as FT-001; this is caller-supplied, not derived from a validated identity).
4. Same entry-level validation as FT-001 (at least one entry, `Sets > 0`, at least one of `Reps`/`DurationSeconds`).

## Explicitly missing / flagged, not decided here

- **No endpoint to read version history** (list all versions of a Workout, or fetch a specific past version) — not requested. The data is preserved (requirement 1), but nothing exposes it yet.
- **No real authentication** — same gap as FT-001.
- **Exercise existence validation** — same gap as FT-001, unchanged.

## Output

Handed to Service Architect for design.
