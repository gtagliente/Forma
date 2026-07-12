# docs/architecture/

## Purpose

This service's internal architecture: how `docs/product/domain-slice.md`'s concepts map to code (aggregates, persistence, API surface), and decisions local to `training-planning-service`.

## What belongs here

- Internal architecture notes (aggregate boundaries within this service, persistence model, API contract shape).
- `adr/` — decisions scoped to this service only.

## What does NOT belong here

- Decisions that affect another service, cross-service APIs/events, or system-wide architecture → promote to `Forma.Claude`'s `docs/architecture/adr/` instead (same Context Promotion Rule `Forma.Claude` uses). The Central Architect gate (see `../../.claude/agents/`) is what catches this before merge.

## Current state

`adr/` has no local ADRs yet — nothing built so far (`Workout` create/new-version, `Routine` create — see `../features/`) needed a decision with this-service-only scope beyond what's already recorded in each feature's own Design section. `src/` started as the bare generic scaffold (`Forma.Planner.CoreContext`, `Forma.Planner.CoreInfrastructure`, `Forma.Planner.Domain`, `Forma.Planner.Application`, `Forma.Planner.Infrastructure`, `Forma.Planner.Query`, `Forma.Planner.PublicApi`) — same layered CQRS shape as `exercise-service`'s (see `Forma.Exercise/docs/architecture/codebase-baseline.md` for how that shape works in practice). One known pre-existing scaffold issue, same as `exercise-service` had: the `.sln` references a `Forma.UnitTests` project that doesn't exist on disk (`dotnet build` on the `.sln` fails; build individual `.csproj` files instead) — not fixed, flagged in `Forma.Claude/docs/services/training-planning-service/open-questions.md` item 9.
