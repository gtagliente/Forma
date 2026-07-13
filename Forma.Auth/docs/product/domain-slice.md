# identity-service — Domain Slice

_Derived from `Forma.Claude`'s `docs/product/domain-model.md`. **Non-authoritative** — see `README.md`. Copied as of this service's `docs/` bootstrap; if it looks stale, check the source before trusting it._

## User

Every workflow in Forma presupposes an actor. [ADR-001](../../../../Forma.Claude/docs/architecture/adr/ADR-001-user-model-iteration-1.md) confirms a single normal-user persona for this iteration: no coach/delegation, no roles, no differentiated account states. Every account is a simple, equally-privileged normal user.

- All domain data in every other service (Exercises, Workouts, Routines, Workout Sessions) is scoped to the single `User` who owns it, referenced by ID only — no other service loads or duplicates User data.
- Account/profile details beyond bare identity (auth credentials, body metrics, goals) were left undefined centrally. This service is where the **auth** part of that gets answered first — see `architecture.md`/`codebase-baseline.md` for what the actual code already provides (email + password + JWT). Body metrics and goals are explicitly out of scope here (see `Forma.Claude/docs/branches/analysis/pending-items.md` → "Body metrics & goals ownership," deliberately deferred centrally, not this service's to invent).
- Non-human/service account types (API integrations, premium tiers) were considered centrally and explicitly deferred — no concrete requirement exists for them yet.

## What this service does NOT own

Exercise, Workout, Routine, Workout Session, Progress Tracking — all owned by other services, each referencing `User` by ID only for ownership/visibility scoping. This service does not know about any of those concepts.

## Relationships relevant to this service

```
User  ──(owns/scopes data for, referenced by ID only)──▶  Exercise            [exercise-service]
User  ──(owns/scopes data for, referenced by ID only)──▶  Workout, Routine    [training-planning-service]
User  ──(owns/scopes data for, referenced by ID only)──▶  Workout Session     [training-execution-service]
```
