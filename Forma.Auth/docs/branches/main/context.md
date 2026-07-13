# Branch: main

## Purpose

Bootstrap this repository's `docs/` knowledge base, `CLAUDE.md`, and `.claude/agents/` subagents — establishing `identity-service`'s scoped structure (product domain slice, architecture incl. codebase baseline, engineering, features, branches), the local counterpart to `Forma.Claude` becoming the system-wide orchestrator repo. Same intent as `exercise-service`'s `feature/claude_integration` branch and `training-planning-service`'s own `main`-branch bootstrap, done directly on `main` here since this subfolder had no prior branching convention.

## Scope

Documentation only. No feature code was written or changed. The pre-existing code under `app/` predates this branch and came from a FastAPI/`fastapi-users` tutorial starting point (`pyproject.toml`'s `name = "fastapi-tutorial"`) — unlike `training-planning-service`'s bare generic scaffold, there **is** real, functioning code here to reconcile against (registration, JWT login, password reset, email verification, user self-service, all via `fastapi-users`' router factories), closer to `exercise-service`'s situation than `training-planning-service`'s.

## Status

`docs/` and `CLAUDE.md` bootstrapped, including a reconnaissance pass (`../../architecture/codebase-baseline.md`) reconciling the doc structure against what's actually in `app/`. Not yet done: the central Analyst/Architect/Challenger pass to turn `Forma.Claude`'s User domain-model section into this service's own populated `domain.md`/`architecture.md`/`open-questions.md` (that happens in `Forma.Claude`, not here — see `Forma.Claude/docs/services/identity-service/`). No feature has gone through this repo's own local pipeline yet.
