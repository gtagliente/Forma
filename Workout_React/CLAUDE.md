# Workout_React — Service Intelligence Context

## What this repository is

This repository implements **`web-client`**, the user-facing web application for Forma — see `Forma.Claude`'s [docs/services/web-client/README.md](../../Forma.Claude/docs/services/web-client/README.md). Unlike `identity-service`/`exercise-service`/`training-planning-service`/`training-execution-service`, it is not one of ADR-005's four bounded-context services: it owns no domain data and decides no business rules. It **consumes** those services' APIs and presents them through the UI (React, Vite, TypeScript) that already exists in `my-frontend/`.

(Note: this repository currently lives as a subfolder inside the `Forma.Resource` git repo, alongside unrelated sibling folders `Forma.Planner` — a separate service, `training-planning-service` — and `Template_DDD`. Everything under `Workout_React/` is this app; nothing outside it is.)

## The one rule that shapes everything here

**All business/domain logic lives in the backend services. This app owns layout, graphics, and navigation only, plus the wiring (API calls, data mapping, state) needed to populate them with real data.**

Concretely:
- Existing components (`RoutineCard`, `WorkoutCard`, `WorkoutList`, `ExerciseItem`, `ExerciseForm`) and pages (`RoutineDetail`, `WorkoutDetails`) keep their current JSX structure and CSS. Features change *what data* flows into them and *what happens* on user actions (e.g. calling `POST /workouts`), not how they look.
- No validation, business rules, or derived domain state gets invented client-side beyond what's needed to disable a button or show a loading/error state. If a feature seems to need a decision about what's *valid* (not just what's *displayed*), that decision belongs to the backend service that owns the concept — flag it, don't decide it here.
- If a request can't be satisfied without a visual/layout change, that's out of scope for a pure wiring pass — say so explicitly rather than quietly redesigning.

## Source of truth

`Forma.Claude` (sibling repo, `../../Forma.Claude`) is the orchestrator: system-wide product vision, the full domain model, and every cross-cutting ADR live there. This repository's `docs/` holds only what's specific to this client:

- `docs/product/domain-slice.md` is a **derived, non-authoritative** copy of the parts of `Forma.Claude`'s `docs/product/domain-model.md` this UI actually displays. If the two disagree, `Forma.Claude` is correct.
- Any decision made here with cross-service implications gets promoted to `Forma.Claude`'s `docs/architecture/adr/`, per the Context Promotion Rules already established there.
- The backend services this app calls have their own repos: `../../Forma.Exercise` (`exercise-service`), `../Forma.Planner` (`training-planning-service`). Their published API contract (`docs/services/<service>/api-contracts.md` in `Forma.Claude`) is this app's only legitimate source for how to call them — see `docs/services/web-client/open-questions.md` in `Forma.Claude` for why none is published yet, which is the current blocker on real wiring.

## How work happens here

This repository runs a four-stage pipeline, adapted from the backend services' pipeline for a client that has no domain layer to design:

```
Frontend Analyst        <- requirements: which screens/actions, what data, what backend call
    ↓
Frontend Architect       <- design: which endpoint, DTO → existing type mapping, data-fetching approach
    ↓
Frontend Developer        <- implement: API client + hooks + wiring only, layout untouched
    ↓
Developer peer review
    ↓
Central Architect gate (Forma.Claude) — cross-service impact
    ↓
Merge
```

Each role's responsibilities and boundaries are defined as live Claude Code subagents in `.claude/agents/` (`frontend-analyst`, `frontend-architect`, `frontend-developer`). Each agent writes to exactly one section of one file per feature — see `docs/features/README.md` for the shape — never broad, repo-wide edits. This mirrors the backend services' `docs/features/<feature>.md` convention (`Forma.Exercise/.claude/agents/`, `Forma.Planner/.claude/agents/`), so the same review discipline applies to UI wiring as to backend feature work.

## Current status

Just bootstrapped (`CLAUDE.md`, `.claude/agents/`, `docs/` skeleton). No feature has gone through this pipeline yet. The app itself (`my-frontend/`) already has UI built — Routine/Workout/Exercise cards, detail pages, client-side routing — driven entirely by mock data hardcoded in `my-frontend/src/App.tsx`; nothing calls a backend today. Per `Forma.Claude/docs/services/web-client/open-questions.md`, real API wiring is blocked on at least one backend service publishing `api-contracts.md` and an auth/session model being decided — until then, the Frontend Analyst/Architect can still do requirements and design work, but the Frontend Developer stage has nothing real to implement against yet.

## Architecture

`my-frontend/`: Vite + React + TypeScript + React Router, Tailwind-style utility classes. No state management library beyond React's built-in `useState` yet; no API client module exists yet (first feature's Frontend Architect design decides that, once there's a contract to call).
