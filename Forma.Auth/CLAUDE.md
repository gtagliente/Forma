# Forma.Auth — Service Intelligence Context

## What this repository is

This repository implements **`identity-service`**, one of four independently deployable services that make up Forma, decided in `Forma.Claude`'s [ADR-005](../../Forma.Claude/docs/architecture/adr/ADR-005-microservices-architecture.md). It owns the `User` concept — a deliberately minimal single normal-user persona ([ADR-001](../../Forma.Claude/docs/architecture/adr/ADR-001-user-model-iteration-1.md)): no coach/delegation, no roles, no account-state modeling beyond bare identity — see `docs/product/domain-slice.md`.

It has its own independent datastore (SQLite, no shared database with other services) and its own git history conceptually, though it currently lives as the `Forma.Auth` subfolder inside the `Forma.Resource` git repo, alongside unrelated sibling folders (`Forma.Planner`, `Workout_React`) — everything under `Forma.Auth/` is this service; nothing outside it is.

Unlike the other two services, this one is **Python/FastAPI**, not .NET — built on the [`fastapi-users`](https://fastapi-users.github.io/fastapi-users/) library rather than a hand-rolled Clean Architecture/CQRS stack. See `docs/architecture/codebase-baseline.md` before assuming any .NET-service convention carries over.

## Source of truth

`Forma.Claude` (at `../../Forma.Claude` relative to this repo root) is the **orchestrator**: system-wide product vision, the full cross-service domain model, and every cross-cutting ADR live there. This repository's `docs/` holds only what's specific to `identity-service`:

- `docs/product/domain-slice.md` is a **derived, non-authoritative** copy of the User-relevant parts of `Forma.Claude`'s `docs/product/domain-model.md`. If the two ever disagree, `Forma.Claude` is correct — update there first, then resync here.
- Any decision made here that turns out to affect another service must be promoted to `Forma.Claude`'s `docs/architecture/adr/`, per the Context Promotion Rules already established there — not just left local.

## How work happens here

Unlike `Forma.Claude` (analysis-only, no code), this repository is where `identity-service` actually gets built. Work follows the same shape of pipeline the other two service repos use, instead of the system-wide Analyst→Architect→Challenger loop:

```
Service Analyst
    ↓
Service Architect (design)
    ↓
Backend Developer (Python/FastAPI) — implement
    ↓
Developer peer review
    ↓
Service Architect (conformance review)
    ↓
Central Architect gate (Forma.Claude) — cross-service impact
    ↓
Merge
```

Each role's responsibilities and boundaries are defined as live Claude Code subagents in `.claude/agents/` (`service-analyst`, `service-architect`, `backend-developer`) — invoke them directly rather than reading a separate context doc.

## Current status

`docs/` and `.claude/agents/` just bootstrapped (product domain slice, architecture including a codebase-baseline reconnaissance pass, engineering placeholder, features placeholder, branch context for `main`). No feature has gone through the pipeline yet. The existing code under `app/` predates this reorganization — it started from a FastAPI/`fastapi-users` tutorial (see `docs/architecture/codebase-baseline.md` for the real auth mechanism it already provides, and the tutorial-leftover debt that comes with it); nothing there has been reviewed against the pipeline yet.


## Engineering

Here you can find the contract exposed via rest api openapi.json