# Forma.Planner — Service Intelligence Context

## What this repository is

This repository implements **`training-planning-service`**, one of four independently deployable services that make up Forma, decided in `Forma.Claude`'s [ADR-005](../../Forma.Claude/docs/architecture/adr/ADR-005-microservices-architecture.md). It owns Training Planning: `Workout` (a versioned, reusable training plan — editing creates a new immutable version, [ADR-002](../../Forma.Claude/docs/architecture/adr/ADR-002-workout-versioning-and-session-snapshot.md)) and `Routine` (organizes Workouts over time, referencing a Workout live — always the latest version). References Exercise by identity only, no duplication — see `docs/product/domain-slice.md`.

It has its own independent datastore (no shared database with other services) and its own git history — it is not a module of a larger monolith. (Note: this repository currently lives as a subfolder inside the `Forma.Resource` git repo, alongside unrelated sibling folders `Template_DDD` and `Workout_React` — everything under `Forma.Planner/` is this service; nothing outside it is.)

## Source of truth

`Forma.Claude` (sibling repo, `../../Forma.Claude`) is the **orchestrator**: system-wide product vision, the full cross-service domain model, and every cross-cutting ADR live there. This repository's `docs/` holds only what's specific to `training-planning-service`:

- `docs/product/domain-slice.md` is a **derived, non-authoritative** copy of the Workout/Routine-relevant parts of `Forma.Claude`'s `docs/product/domain-model.md`. If the two ever disagree, `Forma.Claude` is correct — update there first, then resync here.
- Any decision made here that turns out to affect another service must be promoted to `Forma.Claude`'s `docs/architecture/adr/`, per the Context Promotion Rules already established there — not just left local.

## How work happens here

Unlike `Forma.Claude` (analysis-only, no code), this repository is where `training-planning-service` actually gets built. Work follows a five-stage pipeline instead of the system-wide Analyst→Architect→Challenger loop:

```
Service Analyst
    ↓
Service Architect (design)
    ↓
Backend Developer (.NET) — implement
    ↓
Developer peer review
    ↓
Service Architect (conformance review)
    ↓
Central Architect gate (Forma.Claude) — cross-service impact
    ↓
Merge
```

Each role's responsibilities and boundaries are defined as live Claude Code subagents in `.claude/agents/` (`service-analyst`, `service-architect`, `backend-developer`) — same roles, same definitions as `exercise-service`'s (`Forma.Exercise/.claude/agents/`), just scoped to this service's own domain slice.

## Current status

Renamed from the shared `Forma.Resource` template naming to `Forma.Planner` (solution, all projects, all internal references) and `docs/` just bootstrapped (product domain slice, architecture placeholder, engineering placeholder, features placeholder). **Greenfield**: no feature has gone through the pipeline yet, and unlike `exercise-service` at its own bootstrap, there is no inherited domain code at all here — `src/` is the bare generic scaffold (CQRS layers, base entity/event/repository abstractions, exception handling, DI wiring) with zero aggregates, commands, handlers, or controllers. See `docs/architecture/README.md` for what that scaffold actually contains.

## Architecture

Structurally identical to `exercise-service`'s (same originating template: `Forma.CoreContext`, `Forma.CoreInfrastructure`, `Forma.Domain`, `Forma.Application`, `Forma.Infrastructure`, `Forma.Query`, `Forma.PublicApi` — CQRS with EF Core write side + Mongo-shaped read side kept in sync via MediatR domain-event notifications). See `Forma.Exercise/docs/architecture/codebase-baseline.md` for the pattern description — it applies here too, just with the concrete `Exercise`/`ExerciseResource` types replaced by nothing yet (this is where `Workout`/`Routine` will go).


## Engineering

Here you can find the contract exposed via rest api openapi.json