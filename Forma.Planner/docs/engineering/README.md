# docs/engineering/

## Purpose

Coding standards, git workflow, testing strategy, and devops for `training-planning-service`'s own codebase.

## Current state

Empty. Tech stack and conventions aren't formally decided yet — though the bare scaffold under `../../src/` already carries real starting points worth codifying here later: `.editorconfig`-equivalent conventions (via Roslynator analyzers), `Directory.Build.props`/`Directory.Packages.props` (central package version management), and the Clean-Architecture project split (`Forma.Planner.Domain`, `Forma.Planner.Application`, `Forma.Planner.Infrastructure`, `Forma.Planner.PublicApi`, `Forma.Planner.Query`) — the same split `exercise-service` uses. Populate this once the Service Architect has actually reviewed those choices for this service, rather than assuming they're already the answer.
