# docs/branches/

## Purpose

Branch-scoped, temporary context for this repo's own git branches — mirrors `Forma.Claude`'s `docs/branches/` pattern. Anything durable discovered on a branch should be promoted to `../product/`, `../architecture/`, or `../../.claude/agents/` before that branch's context is considered closed.

## Current state

One branch documented: `main/` — this bootstrap work (rename + `docs/` structure) happened directly on `main` rather than a dedicated feature branch, since `Forma.Resource` (the containing repo) had no branching convention established yet for this subfolder. See `main/context.md`.
