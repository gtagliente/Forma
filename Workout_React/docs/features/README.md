# docs/features/

## Purpose

One `.md` file per feature built in `web-client`, holding the Frontend Analyst's requirements, the Frontend Architect's design, the developer/conformance review, and the Central Architect gate note for that feature — see `../../.claude/agents/` for the pipeline that produces these sections.

## Shape

Each file (`FT-NNN-short-name.md`) has four sections, appended in order as the feature moves through the pipeline:

- `## Requirements (Frontend Analyst)`
- `## Design (Frontend Architect)`
- `## Review (Developer peer review + Frontend Architect conformance review)`
- `## Central Architect Gate`

A one-line `## Status` under the title tracks where the feature currently stands.

Each stage writes only its own section — this is a hard rule, not a style preference (see `../../CLAUDE.md`), so the file's history stays an honest record of who decided what.

## Current state

No features built yet. Real wiring work is blocked on the items in `../../../Forma.Claude/docs/services/web-client/open-questions.md` (no published backend `api-contracts.md`, no auth model) — Requirements/Design stages can still proceed for features that don't depend on a live call (e.g. anything that's pure layout-data restructuring using existing mock data), but should say explicitly when they're blocked rather than designing against a guess.
