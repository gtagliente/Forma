# docs/architecture/

## Purpose

This service's internal architecture: how `docs/product/domain-slice.md`'s concepts map to code (aggregates, persistence, API surface), and decisions local to `training-planning-service`.

## What belongs here

- Internal architecture notes (aggregate boundaries within this service, persistence model, API contract shape).
- `adr/` — decisions scoped to this service only.

## What does NOT belong here

- Decisions that affect another service, cross-service APIs/events, or system-wide architecture → promote to `Forma.Claude`'s `docs/architecture/adr/` instead (same Context Promotion Rule `Forma.Claude` uses). The Central Architect gate (see `../agents/process.md`) is what catches this before merge.

## Current state

Empty. No feature has gone through the pipeline yet. Unlike `exercise-service`, there's no inherited domain code to document a baseline for — `src/` is the bare generic scaffold (`Forma.Planner.CoreContext`, `Forma.Planner.CoreInfrastructure`, `Forma.Planner.Domain`, `Forma.Planner.Application`, `Forma.Planner.Infrastructure`, `Forma.Planner.Query`, `Forma.Planner.PublicApi`) with zero aggregates, commands, handlers, or controllers — same layered CQRS shape as `exercise-service`'s (see `Forma.Exercise/docs/architecture/codebase-baseline.md` for how that shape works in practice, once populated). One known pre-existing scaffold issue, same as `exercise-service` had: the `.sln` references a `Forma.UnitTests` project that doesn't exist on disk (`dotnet build` on the `.sln` fails; build individual `.csproj` files instead) — not fixed here, flagged for whoever picks up the first feature.
