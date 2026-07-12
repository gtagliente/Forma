# Branch: main

## Purpose

Rename this repository from the shared `Forma.Resource` template naming to `Forma.Planner` (solution, all projects, all internal references), then bootstrap its `docs/` knowledge base and `CLAUDE.md` — establishing `training-planning-service`'s scoped structure (product domain slice, architecture, engineering, agents pipeline, features, branches), the local counterpart to `Forma.Claude` becoming the system-wide orchestrator repo. Same intent as `exercise-service`'s `feature/claude_integration` branch, done directly on `main` here since this subfolder had no prior branching convention.

## Scope

Rename + documentation only. No feature code was written. The pre-existing code under `../../src/` predates this work and is the bare generic scaffold this and `exercise-service` both originate from — unlike `exercise-service`, there was no inherited domain-specific code to reconcile against (confirmed by inspection: `Forma.Planner.Domain` has no aggregates, `Forma.Planner.Application` has no commands/handlers beyond the generic pipeline behavior, `Forma.Planner.PublicApi` has no controllers beyond the generic scaffold).

## Status

Rename verified by building `src/Forma.Planner.PublicApi/Forma.Planner.PublicApi.csproj` directly (the `.sln` itself has a pre-existing broken reference to a nonexistent `Forma.UnitTests` project, inherited from the same template `exercise-service` had — not fixed here). A pre-existing `Directory.Packages.props` package-version pin (`Microsoft.Extensions.DependencyInjection` fixed below what `MediatR 13` transitively needs) was also fixed, same issue `exercise-service` hit. `docs/` and `CLAUDE.md` bootstrapped. Not yet done: the central Analyst/Architect/Challenger pass to turn `Forma.Claude`'s Workout/Routine domain-model sections into this service's own `domain.md`/`architecture.md`/`open-questions.md` (that happens in `Forma.Claude`, not here — see `Forma.Claude/docs/services/training-planning-service/`).
