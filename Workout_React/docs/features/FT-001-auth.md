# FT-001 — Authentication

## Status

Design complete (Frontend Architect); pending implementation (Frontend Developer).

## Requirements (Frontend Analyst)

### Summary

This is the first feature through the pipeline. It adds registration, login, logout, and a "who's logged in" display to `web-client`, wired against the real `Forma.Auth` backend (FastAPI-Users, JWT). Today the app has no auth concept at all — no login/register screens, no user state, no route protection — so unlike later features this one requires **new screens**, not just wiring an existing one. Per the request, that's an explicit, named exception to this repo's normal "don't touch layout" rule, not a scope violation: new screens are needed, but they must be built from the app's existing visual language (dark theme, Tailwind utility classes, card/border/rounded-lg conventions, `lucide-react` icons — see `RoutineCard.tsx`, `App.tsx`), not a new design system.

Because this feature establishes the auth pattern, its outcomes (how a token is carried, how "current user" is exposed) will be reused by every later feature that wires exercise/workout/routine calls. That reuse need is a requirement to keep in mind during design; the actual mechanism is the Frontend Architect's decision, not mine.

### Screens needed (new)

1. **Login screen** — email + password input, submit action, error display, link to Register.
2. **Register screen** — email + password input, submit action, error display, link to Login.
3. **Logged-in-state indicator** — some persistent, always-visible element (e.g. showing the current user's email, plus a logout action) so the user can tell they're logged in and log out from anywhere in the app. Flagging explicitly: no shared header/nav/shell currently exists — `App.tsx` renders routed pages directly with no wrapping layout. Introducing a persistent indicator visible across the routine list and detail pages therefore implies *some* new shared chrome, which is a step beyond "add a standalone screen." I'm not deciding its placement or structure (that's a design call), just noting the requirement can't be satisfied by a single isolated component — the Architect should treat this explicitly rather than it being discovered mid-implementation.

### Backend contract (`Forma.Auth/openapi.json`), as it constrains requirements

- **Login** — `POST /auth/jwt/login`, `application/x-www-form-urlencoded` body with `username` (the user's email) and `password`. Success (200) returns `{access_token, token_type}`. Failure: 400 with `detail: "LOGIN_BAD_CREDENTIALS"` (covers both wrong credentials and inactive user) or `detail: "LOGIN_USER_NOT_VERIFIED"`; 422 on malformed input. The login screen must be able to show a distinct message for "not verified" vs "bad credentials" since the backend distinguishes them.
- **Register** — `POST /auth/register`, JSON `{email, password}` (`is_active`/`is_superuser`/`is_verified` are backend-controlled, not user input). Success (201) returns `UserRead {id, email, is_active, is_superuser, is_verified}`. Failure: 400 `REGISTER_USER_ALREADY_EXISTS` or `REGISTER_INVALID_PASSWORD` (password policy is backend-owned — Forma.Auth's concern, not something to replicate as client-side validation logic here beyond disabling submit on empty fields); 422 on malformed input.
- **Logout** — `POST /auth/jwt/logout`, requires the bearer token attached, no body. 200 on success, 401 if the token is missing/invalid.
- **Current user** — `GET /users/me`, requires the bearer token attached, returns `UserRead`. This is what the "who's logged in" indicator needs at minimum — the `email` field is the natural display value. 401 if there's no valid token.
- Not in scope for this feature but present in the contract: `PATCH /users/me` (profile edit), email verification (`/auth/verify`, `/auth/request-verify-token`), and password reset (`/auth/forgot-password`, `/auth/reset-password`). Only login/register/logout/current-user are requested; the others aren't needed to satisfy this feature, though the login screen does need to handle the `LOGIN_USER_NOT_VERIFIED` error state even without building the verification flow itself.
- Worth flagging as a hard constraint on the design, not a decision I'm making: **this contract has no refresh-token endpoint.** The bearer token is a single opaque, presumably expiring JWT with no documented renewal path. Whatever session-persistence approach the Architect picks has to account for "the token eventually stops working and there's no API-level refresh" — re-login is the only documented recovery.

### Cross-cutting requirement: token attachment

Once a user is logged in, the access token must be attached to subsequent API calls that require it — at minimum `Forma.Auth`'s own `GET /users/me` and `POST /auth/jwt/logout`, and by extension whatever calls later features make once `exercise-service`/`training-planning-service` start enforcing JWT (per `Forma.Claude/docs/services/web-client/open-questions.md`, they don't yet, but this pattern needs to already work when they do). This is stated here as a requirement only — **where** the token is stored (memory, localStorage, cookie) and **how** it gets attached (manual header per call, fetch/axios interceptor, etc.) is explicitly the Frontend Architect's call, not decided here.

### Open product question: what does "logged out" look like for the existing routine/workout list?

The existing `/` route (routine list, `RoutineCard`/`WorkoutList`) currently shows mock data to anyone, unconditionally — there's no ownership concept at all yet (per `docs/product/domain-slice.md`, `training-planning-service` doesn't associate routines with a user, and `identity-service`-equivalent data doesn't exist server-side for these entities). The request doesn't say whether adding auth means this view should now be **gated** (redirect to login if not authenticated) or remain **visible while logged out** (auth only required for actions, or not required at all yet since routines aren't user-scoped on the backend regardless of who's logged in). I'm not assuming an answer — flagging this as a genuine open product decision, because:
- Gating it would be the "normal" expectation once login exists, but the data behind it isn't actually scoped per-user server-side yet, so gating wouldn't currently protect anything real.
- Leaving it open means "logged in" has no visible effect on the app's main screen yet except the indicator, which may or may not be the intent.

This needs a product/UX decision before design can commit to route-protection behavior.

### Out of scope for this feature

- Any decision about password validation rules, verification requirements, or account policy — owned by `Forma.Auth`'s own backend team/analyst, not this pipeline.
- Wiring the token into `exercise-service`/`training-planning-service` calls — those services don't enforce JWT yet; this feature only needs to make the mechanism available for later features to reuse.
- Any visual/layout redesign beyond what's strictly needed to add the login/register screens and the logged-in indicator described above.

## Design (Frontend Architect)

### Contract used, and a gate note

`identity-service`'s `api-contracts.md` in `Forma.Claude` is still an unpopulated placeholder — normally that would stop this design per this role's hard gate. It doesn't apply cleanly here: `Forma.Auth/openapi.json` is a generated, versioned formal contract (not reverse-engineered controller code or a guess), and it's the same source the Frontend Analyst already cited as "Backend contract" for the Requirements section. I read it directly (`Forma.Resource/Forma.Auth/openapi.json`) and designed against it. Flagging to Central Architect Gate: `docs/services/identity-service/api-contracts.md` should be back-filled from this openapi.json now that a client design depends on it, so the next service that needs it doesn't re-litigate this.

I also independently verified the ownerId/requestingUserId claim that resolves the gating question below: `Forma.Planner/docs/engineering/openapi.json` — `CreateRoutineCommand` and `CreateWorkoutCommand` both list `ownerId` in their `required` array, and both `getall` endpoints have `requestingUserId` as `"required": true` query params. By contrast, `Forma.Exercise/docs/engineering/openapi.json`'s `CreateExerciseCommand.ownerId` is `"nullable": true` and absent from `required` — exercise-service doesn't force an owner today. That asymmetry is worth Central Architect awareness later (should exercise-service also require ownership?) but isn't this feature's decision.

### Token storage: `localStorage`, plain (not httpOnly cookie)

A cookie-based session isn't available — `Forma.Auth` returns the JWT as a JSON body field (`BearerResponse.access_token`), not a `Set-Cookie`, and making it one would be a backend change outside this repo. Between in-memory-only and `localStorage`, I chose `localStorage`: the requirement is a persistent, always-visible logged-in indicator and (per the tie-break below) a gated `/`, both of which need the session to survive a page reload, not just an SPA navigation. There's no refresh token, so the token is inherently short-lived and self-expiring — the usual "XSS can steal a long-lived refresh token" concern is smaller here (worst case is one access token, already time-boxed by the backend). Storage key: `forma.auth.token`, a single string, nothing else persisted (no user object — see below).

### Token attachment: one shared fetch wrapper, reused per backend service

New module `my-frontend/src/lib/api/token.ts`: `getToken(): string | null`, `setToken(token: string): void`, `clearToken(): void` — the only code that touches `localStorage` directly.

New module `my-frontend/src/lib/api/authFetch.ts`: `authFetch(url: string, init?: RequestInit): Promise<Response>` — wraps `fetch`, merges `Authorization: Bearer <token>` onto `init.headers` when a token is present, otherwise calls through unchanged. This is the reusable pattern later features plug into for `exercise-service`/`training-planning-service` once they start enforcing JWT — it doesn't know or care which service it's calling.

New module `my-frontend/src/lib/api/config.ts` holds one base-URL constant per backend service, since the app talks to three fixed origins, not one:
```
AUTH_API_BASE_URL = 'http://localhost:8000'
EXERCISE_API_BASE_URL = 'https://localhost:7225'
PLANNING_API_BASE_URL = 'https://localhost:7226'
```
Only `AUTH_API_BASE_URL` is consumed this feature; the other two are declared now so later features don't reinvent where base URLs live. No generic multi-tenant client abstraction — three `const`s is enough for three known origins.

New module `my-frontend/src/lib/api/authApi.ts`, the only code that knows `Forma.Auth`'s actual endpoints/error shapes: `login(email, password)`, `register(email, password)`, `logout()`, `fetchCurrentUser()`. `login`/`logout`/`fetchCurrentUser` go through `authFetch`; `register` doesn't need auth attached (no token yet). Each throws a typed error the UI can branch on (see error mapping below) rather than leaking raw `Response`/`ErrorModel` shapes into components.

**External blocker, not solved here**: none of the three backends has CORS configured for a browser origin yet. `authFetch`/`authApi` will be built to the contract regardless; actually exercising them against a running `Forma.Auth` locally is blocked until that's fixed backend-side. Noting it so it isn't rediscovered as a surprise at verify-time.

### Auth context/store: React Context, hydrated from the token on load

New `my-frontend/src/context/AuthContext.tsx`: `AuthProvider` + `useAuth()` exposing
```
{ user: { id: string; email: string } | null,
  isAuthenticated: boolean,
  isLoading: boolean,        // true while resolving the stored token on first mount
  login(email, password): Promise<void>,
  register(email, password): Promise<void>,
  logout(): Promise<void>,
  error: string | null }
```
`user` is never persisted directly — only the token is. On mount, if `getToken()` returns a value, the provider calls `fetchCurrentUser()` (`GET /users/me`) to populate `user`; a 401 means the stored token is dead, so it's cleared and the user treated as logged out. This keeps a single source of truth (the token) and guarantees `user.id` is always fresh from the backend rather than a stale local copy — `user.id` is exactly the id later features need for `ownerId`/`requestingUserId`. `login()` calls `POST /auth/jwt/login`, stores the returned token, then immediately calls `fetchCurrentUser()` to populate `user` (the login response itself has no user info, only the token). `register()` calls `POST /auth/register` and does **not** log the user in automatically (the contract returns `UserRead`, no token) — on success it redirects to `/login` (via router state) with a "registered — please log in" hint rather than the design inventing an auto-login the backend doesn't support. `logout()` calls `POST /auth/jwt/logout` best-effort (clears local state regardless of whether the network call itself succeeds, since a dead/expired token would 401 on logout too and local logout must still work).

`types.ts` gains one addition: `export interface User { id: string; email: string; }` (mapped from `UserRead`, dropping `is_active`/`is_superuser`/`is_verified` — not needed by any screen this feature builds; verification state is surfaced via the login error code, not by displaying the user's own record).

### Screens

`my-frontend/src/pages/Login.tsx` — email + password inputs, submit button, link to `/register`. Error display branches on the thrown error from `authApi.login`: `LOGIN_BAD_CREDENTIALS` → "Incorrect email or password."; `LOGIN_USER_NOT_VERIFIED` → "This account hasn't been verified yet."; 422 / anything else → generic "Something went wrong, please check your input." Submit disabled while empty or while a request is in flight (no client-side password-policy validation — that's `Forma.Auth`'s domain per Requirements).

`my-frontend/src/pages/Register.tsx` — same shape: email + password, submit, link to `/login`. Error branches: `REGISTER_USER_ALREADY_EXISTS` → "An account with this email already exists."; `REGISTER_INVALID_PASSWORD` → surface the backend's own `detail.reason` string verbatim (password policy is backend-owned; echoing its message avoids re-encoding a policy client-side); 422 → generic message.

Both screens follow the existing dark theme already established in `RoutineCard.tsx`/`App.tsx` (`bg-gray-950` page background, `bg-gray-800` / `border-gray-600` / `rounded-lg` card, white heading text, `text-gray-400` secondary text, `blue-400` accent) — not `ExerciseForm.tsx`'s light-theme styling, which is inconsistent with the rest of the app and shouldn't be used as the reference here.

### Logged-in indicator: a minimal shared shell, scoped to the authenticated routes only

No global header exists today; introducing one for two data points (email + logout) across every possible page would be more chrome than this feature needs, especially once "/" is gated (below) — an unauthenticated visitor never reaches any page besides `/login`/`/register`, so there's nothing for a header to show them yet anyway. Scope it instead to the protected route group:

New `my-frontend/src/components/Layout/AppHeader.tsx` — a thin bar (`bg-gray-900`, `border-b border-gray-700`, consistent with existing card borders) showing `user.email` and a logout button, rendered once via a layout route wrapping `/`, `/routine/:id`, `/workout/:id` with `<Outlet/>` beneath it. This satisfies "persistent, visible across the routine list and detail pages" without touching those pages' own JSX.

New `my-frontend/src/components/Layout/ProtectedRoute.tsx` — while `isLoading` is true (initial token check in flight), renders nothing/a minimal placeholder to avoid a flash-redirect on refresh; once resolved, redirects to `/login` if `!isAuthenticated`, otherwise renders its children (`AppHeader` + `Outlet`).

`App.tsx`'s route tree becomes (routes only, JSX/CSS of the existing page elements untouched):
```
<AuthProvider>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute><AppHeader /></ProtectedRoute>}>
      <Route path="/" element={...existing routine-list markup...} />
      <Route path="/routine/:id" element={<RoutineDetail .../>} />
      <Route path="/workout/:id" element={<WorkoutDetail .../>} />
    </Route>
  </Routes>
</AuthProvider>
```

### Tie-break: `/` becomes gated, starting now

The Analyst's open question was whether gating `/` protects anything real today, given `training-planning-service` doesn't scope routines per-user yet and `App.tsx` still renders hardcoded mock data. That's true in isolation — but the ownerId/requestingUserId finding changes the time horizon: the very next feature that wires `training-planning-service` cannot call `GET /api/routines/getall` or create a routine/workout at all without a `requestingUserId`/`ownerId`, both mandatory. Gating `/` isn't optional UX polish that can be deferred — it's about to become a hard technical precondition for that feature to function. Building the `ProtectedRoute` pattern now, while this feature is already establishing the reusable auth plumbing, costs one small component and means the next feature only has to plug a real fetch into an already-gated route instead of retrofitting route protection under it. Decision: `/`, `/routine/:id`, `/workout/:id` all redirect to `/login` when not authenticated, effective this feature, even though the data behind them is still mock.

### Summary of new files (design-level; Frontend Developer owns actual implementation)

- `src/lib/api/config.ts`, `src/lib/api/token.ts`, `src/lib/api/authFetch.ts`, `src/lib/api/authApi.ts`
- `src/context/AuthContext.tsx`
- `src/components/Layout/AppHeader.tsx`, `src/components/Layout/ProtectedRoute.tsx`
- `src/pages/Login.tsx`, `src/pages/Register.tsx`
- `src/types.ts`: add `User`
- `src/App.tsx`: wrap in `AuthProvider`, restructure `Routes` per the tree above (existing page elements' internals untouched)

## Review (Developer peer review + Frontend Architect conformance review)

**Verdict: Approve.**

Reviewed as peer developer (did not implement this feature). Read the Requirements + Design sections above, then the implementation: `src/lib/api/{config,token,authFetch,authApi}.ts`, `src/context/AuthContext.tsx`, `src/components/Layout/{ProtectedRoute,AppHeader}.tsx`, `src/pages/{Login,Register}.tsx`, and the diffs to `types.ts`/`App.tsx`.

**Module boundaries**: match the design's file list exactly — `config.ts` (three base-URL consts, only `AUTH_API_BASE_URL` used), `token.ts` (the sole `localStorage` accessor), `authFetch.ts` (fetch wrapper), `authApi.ts` (only module that knows Forma.Auth's endpoint/error shapes). Verified with `grep -r localStorage src/`: only `token.ts` touches it. Verified with `grep` for token accessors: only `AuthContext.tsx`/`authApi.ts`/`authFetch.ts`/`token.ts` reference `getToken`/`setToken`/`clearToken`/`access_token` — nothing bypasses `token.ts`.

**Storage key**: `forma.auth.token`, matches design verbatim, single string, no user object persisted.

**`Authorization: Bearer` attachment**: `authFetch.ts` correctly merges `Authorization: Bearer <token>` via `Headers` when a token exists, passes through a plain `fetch` otherwise. `login`/`logout`/`fetchCurrentUser` route through it; `register` correctly bypasses it (no token yet), as specified.

**Error-message mapping**: `AuthContext.tsx`'s `toDisplayMessage` matches the design's copy exactly for `LOGIN_BAD_CREDENTIALS`, `LOGIN_USER_NOT_VERIFIED`, `REGISTER_USER_ALREADY_EXISTS`, `REGISTER_INVALID_PASSWORD` (echoes `reason` verbatim), and a generic fallback for anything else (422/`UNKNOWN_ERROR`).

**Rehydration/401 handling**: `AuthContext`'s mount effect calls `fetchCurrentUser()` (`GET /users/me`) when a stored token exists, sets `user` on success; on **any** thrown error (not just a narrowly-checked 401) it clears the token and treats the user as logged out. `authApi.fetchCurrentUser` doesn't distinguish status codes beyond `ok`/not-`ok`, so this is a slightly looser check than "specifically 401" — acceptable in practice since 401 is the only realistic failure mode for this call, but worth a note rather than a blocker.

**Route tree**: `App.tsx` diff matches the design's tree exactly — `/login`, `/register` outside the guard; `/`, `/routine/:id`, `/workout/:id` nested under `<ProtectedRoute><AppHeader/></ProtectedRoute>`. Existing page markup (routine list JSX, `RoutineDetail`, `WorkoutDetail` usages) is untouched inline, only re-indented under the new `<Route>` nesting.

**Scope discipline**: `git diff --stat -- Workout_React` shows only `App.tsx` (+29/-12) and `types.ts` (+5) modified, plus the new files under `lib/`, `context/`, `components/Layout/`, `pages/Login.tsx`, `pages/Register.tsx`. `RoutineCard.tsx`, `WorkoutCard.tsx`, `WorkoutList.tsx`, `RoutineDetail.tsx`, `WorkoutDetails.tsx`, `ExerciseItem.tsx`, `ExerciseForm.tsx` do not appear in the diff at all — confirmed byte-for-byte untouched. `types.ts` gains exactly the `User` interface specified, nothing else.

**Correctness/quality**: hooks rules respected (no conditional hooks, effect deps `[]` correct for a mount-only hydrate); `void hydrate()` / `void logout()` used deliberately to silence unhandled-promise-rejection concerns, and both screens' submit handlers wrap `await` in try/catch so no unhandled rejections. `useAuth()` throws a clear error outside `AuthProvider` rather than silently returning `undefined`. The `react-refresh/only-export-components` lint suppression in `AuthContext.tsx` is explained inline and standard for a Context+hook module. No obvious null-safety gaps — `AppHeader`'s `user?.email` is defensive even though `ProtectedRoute` guarantees a non-null user by the time it renders.

**Independently verified**: `npm run build` (`tsc -b && vite build`) succeeds with no errors; `npm run lint` (`eslint .`) reports zero issues.

No deviations from the design found. No unrequested visual/layout diff. Ready to proceed to Frontend Architect conformance review.

---

### Frontend Architect conformance review

**Verdict: Conforms. Approve for Central Architect Gate.**

This is a conformance pass against the Design section above, not a repeat of the peer developer's code-quality/scope/build check — those are taken as already covered. Read the Design section, the implementation (`src/lib/api/{config,token,authFetch,authApi}.ts`, `src/context/AuthContext.tsx`, `src/components/Layout/{ProtectedRoute,AppHeader}.tsx`, `src/pages/{Login,Register}.tsx`, `types.ts`/`App.tsx` diffs), and the peer review notes, then checked each specific decision the Design section made:

- **Token storage mechanism/key**: `token.ts` is the sole `localStorage` accessor (independently re-confirmed via `grep -r localStorage src/`), key `forma.auth.token` — matches verbatim.
- **`authFetch` attachment pattern**: attaches `Authorization: Bearer <token>` via `Headers` only when a token exists, otherwise a plain `fetch` pass-through — matches the designed wrapper exactly. `login`/`logout`/`fetchCurrentUser` route through it; `register` correctly bypasses it (no token yet).
- **Auth-context shape**: `AuthContextValue` matches the designed shape field-for-field — `user`, `isAuthenticated`, `isLoading`, `login`, `register`, `logout`, `error` — same names, same types.
- **Route-tree structure**: `App.tsx` matches the designed tree exactly, including the specific nesting `<Route element={<ProtectedRoute><AppHeader/></ProtectedRoute>}>` with `AppHeader` rendered before `<Outlet/>` — the design's code sketch is reproduced essentially verbatim.
- **Gating tie-break**: `/`, `/routine/:id`, `/workout/:id` are all nested under `ProtectedRoute` and all redirect to `/login` when unauthenticated — the decision is implemented in full, not partially.

Went one level deeper than the peer review on error-shape handling: checked `authApi.ts`'s error branching directly against the primary contract (`Forma.Resource/Forma.Auth/openapi.json`), not just the Design section's paraphrase. The contract's `REGISTER_INVALID_PASSWORD` example is `detail: {code, reason}`; `register()` branches on `detail.code === 'REGISTER_INVALID_PASSWORD'` and surfaces `detail.reason` verbatim, correctly. `LOGIN_BAD_CREDENTIALS`/`LOGIN_USER_NOT_VERIFIED` (plain string `detail`) and the 401-only failure modes on `/auth/jwt/logout` and `/users/me` also match the raw contract, not just the Design section's summary of it.

On the one soft spot the peer review flagged — rehydration clearing the token on *any* thrown error rather than a narrowly-checked 401 — this is not a design deviation: the Design section states intent ("a 401 means the stored token is dead") without mandating a specific status-code check, and `/users/me` per contract only ever returns 200 or 401, so the two are equivalent in practice. Peer review didn't miss a conformance gap here.

No deviations from the Design section found, in the five specific decisions above or elsewhere (module boundaries, screens, `types.ts` addition).

**For Central Architect Gate** (not written here — reporting per role instructions for the next stage to draft that section): nothing new surfaced by this conformance pass. The two items already flagged inline in the Design section should carry forward: (1) back-fill `docs/services/identity-service/api-contracts.md` from `Forma.Auth/openapi.json`, since a client design now depends on it; (2) the `ownerId`/`requestingUserId` asymmetry between `training-planning-service` (required) and `exercise-service` (nullable/optional) is worth Central Architect awareness for consistency.

---

## Central Architect Gate

**Verdict: Approve to merge.**

Reviewed for cross-service impact only (local design/code quality already covered by the developer and conformance reviews above).

- **No false assumptions about another service, no duplicated ownership.** This feature only introduces client-side token storage/attachment and two new screens; it doesn't assume anything about `exercise-service`/`training-planning-service` beyond declaring their base URLs for later features to use. Nothing here duplicates a concept another service owns.
- **`api-contracts.md` gate exception (identity-service)**: reasonable and well-justified (generated `openapi.json`, not reverse-engineered code). Now that a fourth feature in a row (see FT-002–FT-004) has used this same pattern, judged still fine to leave `docs/services/identity-service/api-contracts.md` deferred rather than prompting a backfill now — recorded as a low-priority recommendation in `docs/services/web-client/open-questions.md` #1, not a blocker.
- **`ownerId`/`requestingUserId` asymmetry + unenforced JWT**: already tracked centrally (`docs/services/web-client/open-questions.md` #5, `docs/services/identity-service/open-questions.md` #9). This feature is the one that makes the token real and gives later features something to attach it to — added a timing note to `identity-service/open-questions.md`'s Status section: this is no longer a hypothetical future risk, since real client code now depends on the current permissive trust model. Not urgent enough to block this feature (CORS is still unconfigured on all three backends, so nothing is exercised end-to-end yet), but worth the backend prioritizing item 3 (hardcoded JWT secret) and item 9 (JWT validation) sooner rather than later.
- **No refresh-token endpoint, hardcoded JWT secret**: both already recorded (`web-client/open-questions.md` #7, `identity-service/open-questions.md` #3); this feature's design already accounts for the missing refresh endpoint. Nothing here makes either more urgent beyond the timing note above.

No new cross-service concern rises to needing an ADR or a send-back. Approved.
