# docs/engineering/

## Purpose

Coding standards, git workflow, testing strategy, and devops for `identity-service`'s own codebase.

## Current state

`openapi.json` — the generated REST contract for this service's current API surface (same convention `training-planning-service` uses at `Forma.Planner/docs/engineering/openapi.json`). Otherwise still unpopulated: tech stack and conventions aren't formally decided yet — the existing code carries a few real starting points worth codifying here later: `pyproject.toml`/`uv.lock` (dependency management via `uv`), Python 3.13 (`.python-version`), async SQLAlchemy + `fastapi-users` as the chosen auth library. No test framework, no linter/formatter config, and no migration tooling exist yet at all (see `../architecture/codebase-baseline.md`) — these are real gaps, not just undocumented choices. Populate this once the Service Architect has actually reviewed those choices, rather than assuming they're already the answer.
