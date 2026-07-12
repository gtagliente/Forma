# docs/features/

## Purpose

One `.md` file per feature built in `training-planning-service`, holding the Service Analyst's requirements, the Service Architect's design, the developer/conformance review, and the Central Architect gate note for that feature — see `.claude/agents/` for the pipeline that produces these sections.

## Shape

Each file (`FT-NNN-short-name.md`) has four sections, appended in order as the feature moves through the pipeline:

- `## Requirements (Service Analyst)`
- `## Design (Service Architect)`
- `## Review (Developer peer review + Service Architect conformance review)`
- `## Central Architect Gate`

A one-line `## Status` under the title tracks where the feature currently stands (e.g. "Built. Cleared to merge (pending: ...)").

## Current state

Three features built: `FT-001-workout-create.md`, `FT-002-workout-new-version.md`, `FT-003-routine-create.md`.
