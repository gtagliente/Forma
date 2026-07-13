# identity-service — Codebase Baseline

_Reconnaissance pass over the existing Python code before running any feature through this repo's local pipeline (`../../.claude/agents/`). Read this before re-exploring the codebase in a future session — only re-read source directly if this looks stale or a specific detail isn't covered here._

## Solution shape

Not Clean Architecture / CQRS like the two .NET services (`exercise-service`, `training-planning-service`) — a deliberate difference worth naming, not an oversight to fix: this is a thin FastAPI app built almost entirely on the [`fastapi-users`](https://fastapi-users.github.io/fastapi-users/) library, which supplies the auth/user-management logic as ready-made router factories rather than hand-rolled domain code.

- **`main.py`** — entry point, runs `app.app:app` via `uvicorn`.
- **`app/app.py`** — the FastAPI app itself. Wires five routers from `fastapi_users`: JWT auth (`/auth/jwt`), registration (`/auth`), password reset (`/auth`), email verification (`/auth`), user self-service (`/users`). No hand-written route handlers at all currently.
- **`app/db.py`** — async SQLAlchemy setup (`sqlite+aiosqlite:///./test.db`), the `User` model, `get_async_session`/`get_user_db` dependency providers.
- **`app/users.py`** — `UserManager` (fastapi-users' hook class for register/forgot-password/verify events), the JWT `AuthenticationBackend` (Bearer transport + `JWTStrategy`), and the `fastapi_users`/`current_active_user` dependency objects consumed by `app.py`.
- **`app/schemas.py`** — Pydantic read/create/update schemas, currently pure pass-throughs of `fastapi_users.schemas`' base classes (no Forma-specific fields added).

## User model (`app/db.py`)

```python
class User(SQLAlchemyBaseUserTableUUID, Base):
    posts = relationship("Post", back_populates="user")
```

Inherits `SQLAlchemyBaseUserTableUUID` (fastapi-users' stock table mixin): `id: UUID`, `email`, `hashed_password`, `is_active`, `is_superuser`, `is_verified`. No Forma-specific fields (no display name, no profile data) exist yet — matches `domain-slice.md`'s note that account/profile details beyond bare auth identity are still undefined centrally.

`id` being a UUID is directly compatible with the `Guid ownerId`/`OwnerId` shape every other Forma service already expects per ADR-001's single-owner scoping — no translation needed if/when real cross-service auth wiring happens.

## Auth mechanism actually provided

Genuinely functional, not debt — `fastapi-users` v14 gives this service, via router factories alone:

- **Register**: `POST /auth/register`.
- **JWT login/logout**: `POST /auth/jwt/login`, `POST /auth/jwt/logout` — Bearer-token transport, `JWTStrategy`, 3600s (1 hour) token lifetime. No refresh-token mechanism visible — a new login is required after expiry.
- **Password reset**: `POST /auth/forgot-password`, `POST /auth/reset-password`.
- **Email verification**: `POST /auth/request-verify-token`, `POST /auth/verify`.
- **User self-service**: `GET/PATCH /users/me`, `GET/PATCH/DELETE /users/{id}` (the `{id}` routes are superuser-gated by the library).

## Known debt (tutorial origin — flagged, not fixed)

This codebase started from a FastAPI tutorial (`pyproject.toml`'s `name = "fastapi-tutorial"`, `.idea/FastAPI Tutorial.iml`), the same shape of starting point `exercise-service` had with its `Forma.App`/Shop-Customer template debt. Left for the service loop to triage, not fixed here:

1. **Dead relationship**: `User.posts = relationship("Post", back_populates="user")` references a `Post` model that doesn't exist anywhere in this codebase — leftover from the tutorial's blog-post example, unrelated to Forma's domain.
2. **Unused dependencies**, same tutorial origin: `imagekitio` (image CDN, never imported in `app/`) and `streamlit` (unrelated data-app framework) sit in `pyproject.toml` but nothing uses them.
3. **Unused imports** in `app/app.py`: `File, UploadFile, Form, Depends` (fastapi) and `shutil, os, uuid, tempfile` — leftover from an image-upload feature that was never wired to a route.
4. **Hardcoded JWT/token secret** (`app/users.py`, `SECRET = "sakjdhkjad872323"`) — the same literal is reused for the JWT signing secret, the password-reset token secret, and the email-verification token secret. Not read from `.env` or any environment variable. This is a real security gap the moment this service becomes a live auth boundary (token forgery is trivial for anyone who can read the source) — recorded here for the service loop to prioritize, deliberately not silently fixed as part of a docs-bootstrap pass.
5. **`.env` and `test.db` are not gitignored** — `.gitignore` only excludes `__pycache__/`, build artifacts, and `.venv`. `.env` currently holds only empty ImageKit placeholder values (no real secret in it today), but the pattern itself is a risk once real secrets exist, and `test.db` is the actual SQLite data file.
6. **No real email delivery**: `UserManager.on_after_forgot_password`/`on_after_request_verify` (`app/users.py`) only `print()` the token to the console. Password reset and email verification are wired end-to-end at the routing layer but nothing actually reaches a user's inbox today.
7. **No migration tooling**: `create_db_and_tables()` calls `Base.metadata.create_all` directly at startup (create-if-missing, not a real migration system — no Alembic or equivalent). Adequate for local SQLite dev; a real gap once the schema needs to evolve against existing data.
8. **No test suite**: `pyproject.toml` has no test framework (`pytest`, `httpx`, etc.) as a dependency at all — more fundamental than the .NET services' "tests exist but can't run without Docker" gap; there's no test infrastructure here yet, period.

## Persistence

SQLite (`sqlite+aiosqlite:///./test.db`) — already an independent datastore per [ADR-005](../../../../Forma.Claude/docs/architecture/adr/ADR-005-microservices-architecture.md)'s rule (nothing shared with the other services' databases). Not production-grade infrastructure yet, but that's a deployment decision for later, not an architecture violation today.

## Status

First pass, written while bootstrapping this service's `docs/`. Update this file when a later pass finds it stale, rather than re-deriving all of the above from scratch.
