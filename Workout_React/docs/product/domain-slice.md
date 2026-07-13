# web-client — Domain Slice

**Derived, non-authoritative.** Copied from `Forma.Claude/docs/product/domain-model.md`, scoped to what this app actually displays or lets a user act on. If this disagrees with the source, the source is correct — update there first, then resync here. This app owns none of these concepts; it only presents them.

## Exercise

A reusable training-movement definition (name, description, media, tags, difficulty), owned by `exercise-service`. Shared library + private-per-user. Can have a parent/child hierarchy (variants).

Currently displayed by: `ExerciseItem`, `ExerciseForm` components.

## Workout

A reusable training plan: an ordered set of Exercises, each with sets/reps/duration/rest. Versioned — editing creates a new version. Owned by `training-planning-service`.

Currently displayed by: `WorkoutCard`, `WorkoutList` components, `WorkoutDetails` page.

## Routine

Organizes Workouts over time (which, when, how often). References Workouts live (always latest version). Owned by `training-planning-service`.

Currently displayed by: `RoutineCard` component, `RoutineDetail` page.

## Not yet displayed by this app

- **Workout Session** (actual performance, offline-capable logging) — owned by `training-execution-service`, which has no implementation yet.
- **Progress Tracking** — derived from Workout Sessions, same blocker.
- **User** — `identity-service` has no implementation yet; there is currently no concept of "whose routine this is" the app can resolve against a backend.

## Current local shape (`my-frontend/src/types.ts`)

The app's own `Routine`/`Workout`/`Exercise`/`ExerciseSet` TypeScript interfaces predate any backend wiring and were shaped around mock data, not a published contract. Expect these to need revision once a real `api-contracts.md` exists for the owning service — that reconciliation is a Frontend Architect design-time concern for whichever feature wires the first real call, not something to pre-emptively guess here.
