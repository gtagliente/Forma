# Forma.Planner / docs/

## Purpose

Knowledge base for `training-planning-service` — scoped to this one service only. Mirrors the top-level shape of `Forma.Claude`'s `docs/` (product, architecture, engineering, features, branches), the same shape `Forma.Exercise/docs/` already uses — but everything here is specific to this service; nothing here is system-wide. Agent role definitions live outside `docs/`, as live Claude Code subagents in `../.claude/agents/`.

## Structure

- `product/` — this service's slice of the domain model (Workout, Routine). **Not authoritative** — see `product/README.md`.
- `architecture/` — this service's internal architecture and locally-scoped ADRs.
- `engineering/` — coding standards, git workflow, testing strategy, devops for this service's codebase.
- `features/` — feature-level work tracked within this service.

## What does NOT belong here

- System-wide product vision, cross-service domain concepts, cross-cutting ADRs → `Forma.Claude` (`../../../Forma.Claude/docs/`).
- Decisions that affect more than this one service → promote to `Forma.Claude`'s `docs/architecture/adr/`, per the Context Promotion Rules defined there.

## Current state

Just bootstrapped. No feature has been through the pipeline yet; unlike `exercise-service`, there is no inherited domain code to reconcile against — `src/` is the bare generic scaffold only.
