# training-planning-service — Domain Slice

_Derived from `Forma.Claude`'s `docs/product/domain-model.md`. **Non-authoritative** — see `README.md`. Copied as of this service's `docs/` bootstrap; if it looks stale, check the source before trusting it._

## Workout

A reusable training plan composed of exercises, describing *intended* structure: sequence, reps, duration, sets, weight, rest time, and grouping constructs (supersets, circuits).

- A Workout is a template — it does not itself represent a specific occurrence in time.
- **Versioned (decided, [ADR-002](../../../../Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md))**: editing a Workout's structure or parameters creates a new immutable version rather than mutating the existing one in place. Prior versions remain intact.
- Composed of Exercises with Workout-specific parameters (N:M — an Exercise is referenced by identity only, never duplicated; this service does not own Exercise data, see "What this service does NOT own" below).
- **Set** is an inline ordered entry within a Workout version, not an independently addressable/identified concept (decided centrally) — `{reps, weight/duration}`, no identity or reference usable outside its parent Workout version.
- **Still open** (system-wide, not this service's call alone): can the same Exercise appear more than once in a Workout (e.g. a warm-up set at lower weight, then working sets)? Is rest time per-exercise or per-set?

## Routine

Organizes Workouts over time — which workouts happen, when, and how often (e.g. a weekly pattern: Monday → Upper Body, Wednesday → Lower Body).

- Must **reference** Workouts, not duplicate their detail — editing a Workout should be reflected wherever it's referenced by a Routine, not require the Routine to be updated separately.
- **Reference semantics (decided, [ADR-002](../../../../Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md))**: a Routine references a Workout **live** — it always tracks the latest version, not a version pinned at the time the Routine was created. Editing a Workout therefore changes what every Routine referencing it means going forward, without requiring the Routine itself to be touched. Historical meaning for already-executed occurrences is preserved instead at the Workout Session level (`training-execution-service`'s concern, not this service's).
- **Still open** (system-wide): is a Routine's schedule a repeating pattern (e.g. "every Monday") or bound to actual calendar dates, or both? Can rest days be modeled explicitly?

## Cross-service relationship this service must design for

`training-execution-service` needs to read Workout **Version** data at session-start time (a Workout Session pins the specific version current at that moment, per ADR-002, and that pin never changes afterward even if the Workout is edited later). This is the **first concrete cross-service call** this service needs to support — the actual integration pattern (sync REST vs. async events vs. client-carried data) is still undecided centrally (`Forma.Claude/docs/architecture/integration-patterns.md`, currently empty). Don't invent an answer locally; track it as an open dependency.

There is also a second, newer driver for that same still-undecided integration-pattern question: `exercise-service` can now delete an Exercise (see `Forma.Exercise/docs/features/FT-003-update-delete.md`) with no way to check whether this service's Workout still references it — relevant context if/when this service needs to validate Exercise references at Workout-authoring time.

## What this service does NOT own

Exercise (owned by `exercise-service` — referenced by identity only, never duplicated), Workout Session / Progress Tracking (owned by `training-execution-service`), User/Identity (owned by `identity-service`). This service references `Exercise` and `User` by ID only, per ADR-005's independent-datastore rule — never a cross-service join.

## Relationships relevant to this service

```
Exercise  ──(composed into, N:M, with Workout-specific parameters)──▶  Workout (versioned)
Workout   ──(referenced by, N:M, always latest version — ADR-002)───▶  Routine
Workout   ──(pins the version current at start — ADR-002)───────────▶  Workout Session   [training-execution-service]
Routine   ──(schedules occurrences of)───────────────────────────────▶ Workout Session   [training-execution-service, open: direct, or always via Workout?]
```
