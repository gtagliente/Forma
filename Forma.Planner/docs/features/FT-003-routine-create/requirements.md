# FT-003 — Routine Create — Service Analyst Requirements

## Source

Already decided centrally: `../../product/domain-slice.md` → Routine; [ADR-002](../../../../Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md) (Routine references a Workout live, always latest version — never pinned); ADR-001 (Routine data scoped to a single owning user, same as Workout). No escalation needed.

## Functional requirements

1. A `Routine` is owned by exactly one user (`OwnerId`, required — same as Workout, no shared/private duality).
2. Creating a Routine requires: `Name`, and an ordered collection of **Routine entries**, each referencing exactly one existing `WorkoutId` by identity — **never** duplicating or snapshotting the Workout's content (ADR-002: Routine always resolves to whichever version is current *at the time it's read*, not a version pinned at Routine-creation time).
3. A Routine may reference the **same Workout more than once** (e.g. "Upper Body" on both Monday and Friday) — no uniqueness constraint across entries.
4. `Name` unique per owner, mirroring Workout's own uniqueness scoping (`Forma.Planner/docs/features/FT-001-workout-create/`).

## Explicitly missing / flagged, not decided here

- **Full scheduling model is still an open central question** (recurring pattern vs. calendar dates vs. both — `Forma.Claude/docs/services/training-planning-service/open-questions.md` #1). This feature does **not** attempt to resolve it. Minimal placeholder: each entry may optionally carry a `DayOfWeek` (nullable) as a lightweight recurring-style hint — enough to satisfy "organize workouts... when, how often" without committing to a full calendar/recurrence engine nobody has asked for yet. A Routine with no `DayOfWeek` on any entry is still valid — it's just an ordered list of Workouts with no day assignment.
5. **Workout existence validation** — same shape as FT-001's Exercise-existence gap, except this time the reference target (`Workout`) **is** owned by this same service/datastore, so it actually **can** be validated (unlike `ExerciseId`, which lives in a separate service). This feature **does** validate that each referenced `WorkoutId` exists and belongs to the same `OwnerId` as the Routine (a Routine referencing another user's Workout makes no sense under the single-owner model).
- **No real authentication** — same caller-supplied-`OwnerId` gap as FT-001/FT-002.
- **No Update/Delete for Routine** — not requested, matching this session's scope (Create only, across all three features).

## Output

Handed to Service Architect for design.
