# docs/architecture/

## Purpose

This service's internal architecture: how `docs/product/domain-slice.md`'s concepts map to code, and decisions local to `identity-service`.

## What belongs here

- Internal architecture notes (data model, API surface shape, auth mechanism).
- `adr/` — decisions scoped to this service only.

## What does NOT belong here

- Decisions that affect another service, cross-service APIs/events, or system-wide architecture → promote to `Forma.Claude`'s `docs/architecture/adr/` instead (same Context Promotion Rule `Forma.Claude` uses). The Central Architect gate (see `../../.claude/agents/`) is what catches this before merge.

## Current state

`codebase-baseline.md` — reconnaissance pass over the existing `fastapi-users`-based code. No local ADRs yet (`adr/` empty). No feature has gone through the pipeline yet.
