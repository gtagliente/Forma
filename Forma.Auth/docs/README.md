# Forma.Auth / docs/

## Purpose

Knowledge base for `identity-service` — scoped to this one service only. Mirrors the top-level shape of `Forma.Claude`'s `docs/` (product, architecture, engineering, features, branches), but everything here is specific to this service; nothing here is system-wide. Agent role definitions live outside `docs/`, as live Claude Code subagents in `../.claude/agents/`.

## Structure

- `product/` — this service's slice of the domain model. **Not authoritative** — see `product/README.md`.
- `architecture/` — this service's internal architecture, including a codebase-baseline reconnaissance pass, and locally-scoped ADRs.
- `engineering/` — coding standards, git workflow, testing strategy, devops for this service's codebase.
- `features/` — feature-level work tracked within this service.
- `branches/` — branch-scoped, temporary context for this repo's own git branches.

## What does NOT belong here

- System-wide product vision, cross-service domain concepts, cross-cutting ADRs → `Forma.Claude` (`../../../Forma.Claude/docs/`).
- Decisions that affect more than this one service → promote to `Forma.Claude`'s `docs/architecture/adr/`, per the Context Promotion Rules defined there.

## Current state

Just bootstrapped, reconciled against the existing code (unlike `training-planning-service`'s greenfield bootstrap — closer to `exercise-service`'s situation: real, functioning `fastapi-users`-based auth code already exists under `../app/`). No feature has been through the pipeline yet.
