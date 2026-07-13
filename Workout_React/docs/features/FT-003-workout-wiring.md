# FT-003 — Workout Create/List/Search/New-Version

## Status

Requirements drafted (Frontend Analyst); pending Frontend Architect design.

## Requirements (Frontend Analyst)

### Summary

Wire `WorkoutCard.tsx`, `WorkoutList.tsx`, and `WorkoutDetails.tsx` (`WorkoutDetail` component) to the real `training-planning-service` backend for three actions: create a Workout, list a user's Workouts with client-side search/filter, and add a new version to an existing Workout (the contract's stand-in for "edit" — never a plain update). Today none of these three components talk to a backend; all data is hardcoded mock state in `App.tsx`.

### Current state of the components in scope (read directly, not assumed)

- **`WorkoutCard.tsx`** — pure presentational today. Takes a `workout: Workout` prop, links to `/workout/${workout.id}`, renders `workout.title` and `workout.exercises.map(ex => ex.name)`. Has a decorative Pencil icon with **no `onClick` at all** (unlike the Share icon, which does call `e.preventDefault()`), so today clicking it just navigates to the detail page like the rest of the card — there is no existing "edit" action to preserve, it's a genuinely open wiring decision.
- **`WorkoutList.tsx`** — entirely commented out, dead code. Not imported or rendered anywhere in the app. "Wire the existing `WorkoutList`" in practice means resurrecting an inert stub, not modifying live behavior.
- **`WorkoutDetails.tsx` (`WorkoutDetail`)** — has no data source of its own. It receives a `routines: Routine[]` prop (passed down from `App.tsx`'s mock state) and derives the workout via `routines.flatMap(r => r.workouts).find(w => w.id === id)`. It is entirely dependent on the Routine tree today, not a standalone Workout fetch.
- **No existing UI trigger for "create a workout"** anywhere in the app (no button, no form) — the same category of gap as FT-001's login/register screens: genuinely new UI surface, not just new wiring, per this repo's named exception for that case (`docs/features/FT-001-auth.md`).
- **No existing search/filter input** anywhere in the app either.

### Backend contract as it constrains requirements (`Forma.Planner/docs/engineering/openapi.json`)

- **Create** — `POST /api/workouts/create`. `CreateWorkoutCommand` requires `ownerId` (uuid), `name` (string, max 100 — required yet still marked `nullable` in the schema, a contract oddity worth noting not resolving), `exercises` (array of `WorkoutExerciseEntryDto`). Success wraps the result: `ApiResponseOfCreatedWorkoutResponse` → `result.id` (uuid); failure surfaces via `errors: [{message}]`, not raw HTTP text.
- **List** — `GET /api/workouts/getall`. `requestingUserId` (uuid) is a **required** query param. There is **no other query parameter** — no name/text search, no paging. This confirms the request's premise: any "search/filter" this feature offers is entirely client-side over the full fetched result set; there is no backend call shaped like "search workouts by name." Returns `WorkoutQueryModel[]`: `{id, ownerId, name, currentVersionNumber, exercises: WorkoutExerciseEntryQueryModel[]}`.
- **New version** — `POST /api/workouts/addnewversion`. `AddWorkoutVersionCommand` requires `workoutId` (**not** a bare string — a wrapped `WorkoutId` object shaped `{value: uuid}`, notably different from `WorkoutQueryModel.id`, which *is* a bare uuid string — a request/response asymmetry easy to miss when mapping a picked list item into a new-version request), `ownerId` (uuid), and `exercises` — the **full** array again, not a diff/patch. This means "editing" a Workout means resubmitting the complete new exercise list, not changing one row. The response is a bare `ApiResponse` (`success`/`errors` only) — no updated resource or new version number comes back, so whatever screen shows the workout must re-fetch `getall` afterward to see the bumped `currentVersionNumber`. `403 Forbidden` is a distinct documented response (caller must be the Workout's owner) — the UI needs to be able to show "you don't own this workout" as its own error case, not a generic failure.
- **No update/delete, no get-by-id, no version-history endpoint exist** in this contract at all (confirmed by reading every path under the `Workouts` tag: only `create`, `getall`, `addnewversion`). Two concrete consequences: (1) "edit" really is the distinct `addnewversion` action the request describes, never REST-CRUD `PUT`/`PATCH` symmetry; (2) `WorkoutDetails`, lacking any fetch-by-id, must get its data from an already-fetched `getall` result (in-memory/cache/route-state) or by re-running `getall` and filtering client-side — it cannot assume a dedicated single-workout endpoint exists to call.

### Where does a "workout list" actually live? (flagging, not deciding)

`WorkoutCard` currently only ever renders nested inside `RoutineDetail.tsx`, driven by a Routine's own embedded `workouts` array — there is no standalone "all my workouts" screen/route today. But `GET /api/workouts/getall` returns **all** of the caller's Workouts, independent of any Routine. Satisfying "list with search" as requested needs a Routine-independent workout list; the only existing call site for `WorkoutCard` is Routine-scoped. Whether this becomes a new top-level route, or something added alongside the Routine-nested rendering, is a screens/navigation design call for the Frontend Architect — flagging so it isn't assumed to be "just wire the existing nested rendering."

### Create/new-version need to pick existing Exercises — cross-feature dependency on FT-002

Both `CreateWorkoutCommand.exercises` and `AddWorkoutVersionCommand.exercises` accept only `exerciseId` (uuid) plus workout-specific parameters (`sets`, `reps`, `durationSeconds`, `weight`, `restSeconds`, `sequence`, `groupId`) — never a name or any other Exercise field. So composing a Workout (create or new-version) requires searching/picking from **existing** Exercises, i.e. calling exercise-service's own list endpoint (`GET /api/exercises/getall`, confirmed present in `Forma.Exercise/docs/engineering/openapi.json`; unlike training-planning-service, its `requestingUserId` is optional there). Exercise **creation** is FT-002's separate, parallel feature — this feature must not invent an inline "create a new exercise" affordance inside the Workout form. Flagging the dependency (Workout composition needs an Exercise picker sourced from exercise-service) without deciding how or when the two features' UI pieces connect — that's for the Architect, coordinated against FT-002's own output.

### Existing `types.ts` shape vs. the real contract — concrete divergences

1. `Workout.title` vs. the contract's `name` — simple rename.
2. `Workout.exercises: Exercise[]` embeds full exercise objects (`{id, name, sets}`) inline, and `WorkoutCard.tsx` renders `ex.name` directly. The contract never returns an exercise's name alongside a workout — only `exerciseId`. Displaying a name requires a separate lookup against exercise-service by ID (same dependency as above, not a new one).
3. `ExerciseSet[]` (a per-exercise array of individual set objects, each with its own `reps`/`durationSeconds`/`pauseSeconds`) does not match the contract's shape. The contract models **one** `WorkoutExerciseEntryDto` per exercise-in-workout, with a single `sets: number` **count** plus singular `reps`/`durationSeconds`/`weight`/`restSeconds` — "4 sets of 8 reps at 80kg" as one entry, not four set-objects. This matters beyond naming: per `CLAUDE.md`'s own product vision, a Workout's *planned* structure (sets-as-a-count — exactly what this contract models) is explicitly distinct from a Workout *Session's actual execution* (a per-set log — what today's mock `ExerciseSet[]` actually looks like). The existing mock type is shaped like a Session's actual-execution log, not a Workout template; it modeled the wrong one of two concepts the product vision keeps deliberately separate. Reconciling `types.ts` can't be a light rename — it's a structural replacement for the Workout-side types. (Decision on the exact new shape is the Architect's, not mine — flagging the mismatch and why.)
4. No `ownerId` field exists on the mock `Workout` type — needed since every write call requires it, sourced from `useAuth()`'s `user.id`.
5. `groupId` (superset/circuit grouping key) exists on the contract's exercise-entry shape with no representation anywhere in current UI/types. Flagging its existence (CLAUDE.md lists supersets/circuits as a possible Workout element) — not requesting it be built, since this request doesn't ask for grouping UI.
6. `currentVersionNumber` (int) exists on `WorkoutQueryModel` with no current UI equivalent — available if the Architect wants to surface e.g. "v3" somewhere; not explicitly requested.
7. See the wrapped-`WorkoutId` note above — `AddWorkoutVersionCommand.workoutId` (`{value: uuid}`) vs. `WorkoutQueryModel.id` (bare uuid string) is a real shape trap when wiring "pick a workout from the list, then add a version to it."

### Auth precondition — stated plainly, not optional

`ownerId`/`requestingUserId` are mandatory on all three calls per the schema's own `required` arrays (confirmed by direct inspection of the contract, not inferred). There is no anonymous/guest path for create, list, or new-version — **this feature is unusable without a logged-in user, full stop.** It depends on `useAuth()`'s `user.id` (per FT-001's design) for every one of its three actions.

**Concrete blocker, not just a precondition**: FT-001 (`docs/features/FT-001-auth.md`) is currently *designed only* — its Status line reads "pending implementation," and a repo scan confirms `my-frontend/src/lib/api/` and `my-frontend/src/context/` don't exist yet (no `config.ts`, `authFetch.ts`, or `AuthContext.tsx` on disk). This feature's own eventual Frontend Developer stage cannot start until FT-001's implementation lands `useAuth()`/`authFetch`/`config.ts` for real — noting this now so it isn't rediscovered as a surprise at that stage.

Also still open per `../../../Forma.Claude/docs/services/web-client/open-questions.md`: no CORS configured on `training-planning-service` for a browser origin yet (#6), and cross-service JWT validation doesn't exist server-side yet (#5) — `ownerId`/`requestingUserId` will be taken at face value from whatever the client sends, not verified against the bearer token. Neither blocks writing the wiring code, but both block actually exercising it end-to-end against a live local backend, and #5 is a security property worth the requester knowing isn't real yet.

### Response-envelope / error-handling requirement

All three endpoints wrap responses in an `ApiResponse`-shaped envelope (`success`, `successMessage`, `statusCode`, `errors: [{message}]`, plus `result` on create/getall). Loading/error states (in scope for this role per its "disable a button or show a loading/error state" carve-out) need to branch on `success`/`errors[].message`, not just HTTP status — and `addnewversion`'s documented `403` needs a distinct "you don't own this workout" message rather than a generic failure, since the contract calls that case out separately from `400`/`404`/`500`.

### Out of scope / not this role's to decide

- Whether the Exercise picker is a modal, inline search, or separate page — Frontend Architect's call.
- Whether "new version" is triggered from `WorkoutCard`'s existing (currently non-functional) Pencil icon or only from `WorkoutDetails` — Architect's call; there's no existing behavior to preserve here (see above).
- Resolving the Routine-vs-standalone-list navigation question raised above — Architect's call.
- Any validation of what makes a Workout "valid" (minimum exercises, bounds on sets/reps/weight, etc.) — `training-planning-service`'s domain, not this app's to invent.
- Any visual/layout redesign beyond what's strictly needed for the new create/search UI surfaces — out of this pipeline's "wiring only" mandate.

### Handoff

Handed to the Frontend Architect for design: endpoint-to-action mapping is fixed by the contract above, but screen/navigation structure (standalone list vs. Routine-nested), the exact new `types.ts` shape, the Exercise-picker mechanism (pending coordination with FT-002), and the edit-entry-point choice are all open design decisions.

## Design (Frontend Architect)

### Contract used, and what a direct re-read added

Designing against `Forma.Planner/docs/engineering/openapi.json` directly — same precedent FT-001 established: `training-planning-service`'s `api-contracts.md` in `Forma.Claude` is still unpopulated as a formal artifact, but the openapi.json is a generated, versioned contract, not reverse-engineered controller code, and it's the same document the Requirements section already cites. Re-reading it confirms every claim above exactly, plus one detail not stated verbatim in Requirements: `addnewversion`'s `403` response has `content: {"application/json": {}}` — **no schema reference** — unlike 400/404/500, which all reference `ApiResponse`. That distinction matters for error handling below.

Auth precondition, as instructed: this design assumes `/workouts` and the create/new-version flows only ever render behind FT-001's `ProtectedRoute` (same gated group as `/`, `/routine/:id`, `/workout/:id`). No second `isAuthenticated`/token check is added anywhere in `workoutApi.ts` or the new pages — `useAuth().user` is taken as guaranteed non-null wherever these calls happen, exactly as `WorkoutDetail`/`RoutineDetail` already assume today.

### `lib/api/workoutApi.ts` — new module, mirrors `authApi.ts`'s shape

Three functions, all through `authFetch` against `PLANNING_API_BASE_URL` (declared in `config.ts` by FT-001, unused until now):

- `createWorkout(ownerId, name, exercises: WorkoutExerciseEntry[]): Promise<{ id: string }>` — `POST /api/workouts/create`, body `{ownerId, name, exercises}`. 201 → `result.id`. 400/500 → `WorkoutApiError`, message from `errors[0]?.message`.
- `listWorkouts(requestingUserId: string): Promise<Workout[]>` — `GET /api/workouts/getall?requestingUserId=...`. 200 → `result: WorkoutQueryModel[]` maps onto `Workout[]` field-for-field (names already match 1:1 after the `types.ts` change below — no reshaping function needed). 400/500 → `WorkoutApiError`.
- `addWorkoutVersion(workoutId, ownerId, exercises: WorkoutExerciseEntry[]): Promise<void>` — `POST /api/workouts/addnewversion`, body `{workoutId: {value: workoutId}, ownerId, exercises}`. **This is the one and only place the `{value: uuid}` wrap happens.** Every caller, component, and the `Workout`/`WorkoutExerciseEntry` types only ever see or produce bare uuid strings; `workoutApi.ts` normalizes the shape trap at the boundary, nowhere else. 200 → resolves with no data (per contract — see re-fetch note below). **403 is handled before touching `errors[]`**: since its body has no guaranteed schema, `addWorkoutVersion` treats status 403 as a fixed `WorkoutApiError('FORBIDDEN', "You don't own this workout.")` without attempting to parse a message out of it. 400/404 do parse `errors[0]?.message` (schema-guaranteed there). 500 → generic.

`WorkoutApiError` class: `{ code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'UNKNOWN_ERROR', message: string }` — same shape/spirit as `AuthApiError`. Screens branch on `.code`, never on raw `Response`/status.

### `types.ts` — structural replacement for the Workout side, not a rename

```ts
export interface WorkoutExerciseEntry {
  exerciseId: string;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  weight?: number;
  restSeconds?: number;
  sequence: number;
  groupId?: string;
}

export interface Workout {
  id: string;
  ownerId: string;
  name: string;
  currentVersionNumber: number;
  exercises: WorkoutExerciseEntry[];
}
```

One type covers both directions (create/addnewversion request payload and getall response) since `WorkoutExerciseEntryDto`/`WorkoutExerciseEntryQueryModel` are structurally identical on the wire — a second parallel type would be a shadow model with no behavioral difference. `exerciseId` only, no `name`: display always needs the exercise-service lookup (below).

`Exercise`/`ExerciseSet` (the current mock shapes) are not reused, renamed around, or deleted. `Exercise` stays FT-002's to redefine as the real `exercise-service` library entity. `ExerciseSet` — per the Analyst's finding — is actually shaped like a Workout *Session's* actual-execution log (per-set reps/duration/pause rows), the concept `CLAUDE.md` deliberately keeps distinct from a planned Workout template. It stays declared, unused by this feature's real data, reserved for a future Workout Session feature against `training-execution-service`. Nothing here repurposes it as the Workout-composition type — that's `WorkoutExerciseEntry`, above.

`ownerId` is populated from `useAuth().user.id` at write time (create/addnewversion), never user-entered.

### Display consequence: `ExerciseItem`'s existing prop contract gets mapped data, not a JSX change

`WorkoutExerciseEntry` has no exercise name and no per-set array, but `ExerciseItem.tsx` (rendered inside `WorkoutDetail`, untouched by FT-002 or this feature) still expects `{id, name, sets: ExerciseSet[]}`. Rather than touch its JSX, `WorkoutDetail` maps each real entry into that exact existing shape for **read-only display**:
```
{ id: exerciseId,
  name: exerciseNames[exerciseId] ?? exerciseId,
  sets: Array.from({ length: entry.sets }, (_, i) => ({
    id: `${exerciseId}-${i}`,
    reps: entry.reps ?? 0,
    durationSeconds: entry.durationSeconds ?? 0,
    pauseSeconds: entry.restSeconds ?? 0,
  })) }
```
This is a projection, not synthesized data — "4 sets of 8 reps" and 4 identical set-rows are the same fact shown two ways, exactly what the existing mock data already did (every mock `ExerciseSet` row was already uniform). Flagging plainly: `ExerciseItem`'s expanded-panel Add/Remove-set buttons and per-row inputs have no backend target once fed real data — a planned Workout's "edit" is `addnewversion` resubmitting the whole list, never one set in isolation — so they become inert when reached from real `WorkoutDetail` data, the same already-accepted pattern as `WorkoutCard`'s decorative Pencil icon before this feature. Making them functional needs a JSX/behavior change to `ExerciseItem` itself, out of this pass's scope — flagged, not solved.

### Exercise-name lookup — dependency on FT-002, shape only

Both `WorkoutCard` (exercise-name list) and `WorkoutDetail` (mapping above) need an exerciseId→name lookup. FT-002's Design section is not written yet as of this design (checked directly — its file currently ends at `## Requirements`), so this design does not invent `exerciseApi.ts` or a function name. What's needed: any function returning exercise-shaped objects with at least `{id, name}` — `ExerciseQueryModel` already carries both, so FT-002's own `getall` wiring satisfies this with no extra endpoint required. The new `/workouts` page (below) calls that function once alongside `listWorkouts()` and builds a `Record<string, string>` (exerciseId → name), passed down as a plain prop — no new Context, consistent with the app's no-state-library baseline.

### Where a Workout gets "opened" without a get-by-id endpoint

New top-level route `/workouts` (inside the existing `ProtectedRoute` group). `App.tsx` lifts a second piece of state, `workouts: Workout[]`, next to its existing `routines` `useState` — same precedent already in this codebase. A `useEffect` keyed on `user` (from `useAuth()`) calls `listWorkouts(user.id)` once the gate has resolved and stores the result; a sibling `refreshWorkouts()` (the same call, re-invoked) is passed down alongside it. `workouts` replaces `routines` as `WorkoutDetail`'s data source: `workouts.find(w => w.id === id)` instead of today's `routines.flatMap(r => r.workouts).find(...)`. This is the "list page holds fetched data, detail page reads from it, no second fetch" approach — there is no get-by-id endpoint to call even if a re-fetch were wanted, so the already-fetched array is `WorkoutDetail`'s only legitimate data source.

Consequence for `WorkoutDetail`'s back-link: today it derives `routineId` from the `routines` traversal it no longer performs. Since a Workout is no longer necessarily reached through a Routine, the back-link's target changes from `/routine/${routineId}` to `/workouts` unconditionally (label "Torna ai workout") — a corrected data-derived `to`/label value on the existing `Link`, not a structural change to its `ArrowLeft` + text shell.

`WorkoutList.tsx` (currently dead/commented) is resurrected as the presentational grid: takes `workouts: Workout[]` and `exerciseNames: Record<string, string>`, renders `WorkoutCard` per item — close to its original commented shape. A new `pages/WorkoutsPage.tsx` is the container: reads `workouts`/`exerciseNames`/`refreshWorkouts` (passed down from `App.tsx`), owns the new search-text `useState`, filters client-side by `name` substring (no backend search param — matches FT-002's identical approach for consistency), renders the filter input, a "New Workout" button (opens the create form below), and `<WorkoutList>` with the filtered array.

`WorkoutCard` gains one new optional prop, `exerciseNames?: Record<string, string>` (default `{}`, falling back to raw `exerciseId` display), so its existing `RoutineDetail`-nested call site (`<WorkoutCard workout={w} />`, no new props) keeps working unchanged — Routine wiring stays out of this feature's scope, so `RoutineDetail` itself is not touched.

### Create-Workout flow

New `components/Workout/WorkoutForm.tsx`, shared by create and new-version (same submitted shape: `name` + the full `exercises` list). Rendered as a modal overlay reusing the overlay convention already established in this codebase (`ExerciseItem.tsx`'s `absolute inset-0 z-40 bg-black/50 backdrop-blur` pattern for its "Recupero Generale" popover) rather than a new route — this is a lightweight action, not page-level navigation.

Fields: `name` text input (create mode only, see new-version below); a repeatable row per exercise — an exercise picker (searchable over the FT-002-sourced list, filtered client-side by name) plus number inputs for `sets` (required), `reps`/`durationSeconds`/`weight`/`restSeconds` (all optional, per the contract's nullable fields); Add/Remove-row buttons reusing `ExerciseItem`'s existing Plus/Minus icon convention for visual consistency. `sequence` is not a user-entered field — it's derived from each row's position in the list at submit time (0-based index), since it only expresses row order already visible in the UI, not a new domain decision. `groupId` is omitted entirely (superset/circuit grouping isn't requested — Requirements item 5 flags it, doesn't ask for it built).

Submit disabled while `name` is empty (create mode), zero exercise rows, or a request is in flight. On success, `createWorkout` returns only `{id}` (no full resource) — the form closes and calls `refreshWorkouts()` (re-runs `getall`) rather than constructing a `Workout` from the create response, the same "envelope returns no resource, re-fetch to see real state" pattern the contract forces for `addnewversion` too.

### New-version action surface

Two entry points open the same `WorkoutForm` in edit mode (pre-filled with the target Workout's current `name` — display-only, since `AddWorkoutVersionCommand` carries no `name` field at all, flagged so it isn't assumed renamable — and `exercises`):
1. `WorkoutCard`'s existing Pencil icon, wired with `e.preventDefault()` (matching the Share icon's existing pattern) — but only when the card receives a new optional `onEdit?: (workout: Workout) => void` prop. `WorkoutsPage` passes it (it has `workouts`/`refreshWorkouts` in scope); `RoutineDetail`'s existing call site doesn't, so the Pencil icon keeps its exact current no-op behavior there (falls through to card navigation) — no behavior change to the Routine-nested path, no prop-drilling through `RoutineDetail`'s still-mock data.
2. A small new "Edit" button in `WorkoutDetail`'s header, next to the back-link — the same minimal-new-UI-surface exception FT-001/FT-002 already established for a genuinely missing affordance.

On submit, edit mode calls `addWorkoutVersion(workout.id, user.id, exercises)` (bare id in — the `{value}` wrap happens inside `workoutApi.ts` only), then `refreshWorkouts()` (the only way to observe the bumped `currentVersionNumber`, since the endpoint returns nothing), then closes. A thrown `WorkoutApiError('FORBIDDEN', ...)` renders as "You don't own this workout." distinctly from the generic validation/error message, per the contract's separately-documented `403`.

### Summary of new/changed files (design-level; Frontend Developer owns actual implementation)

- New: `src/lib/api/workoutApi.ts`
- New: `src/pages/WorkoutsPage.tsx`, `src/components/Workout/WorkoutForm.tsx`
- Changed: `src/types.ts` (`Workout`, new `WorkoutExerciseEntry`; `Exercise`/`ExerciseSet` untouched)
- Changed: `src/components/Workout/WorkoutList.tsx` (resurrected), `src/components/Workout/WorkoutCard.tsx` (new optional `exerciseNames`/`onEdit` props, Pencil icon wired), `src/pages/WorkoutDetails.tsx` (reads `workouts` prop instead of `routines`, mapped `ExerciseItem` data, corrected back-link, new Edit button)
- Changed: `src/App.tsx` (lift `workouts`/`refreshWorkouts` state next to `routines`, add `/workouts` route inside the `ProtectedRoute` group, pass `workouts` to `/workout/:id` instead of `routines`)

### Central Architect Gate flags

- `training-planning-service/api-contracts.md` is now depended on by two client designs (FT-001's tie-break, and this one) while still unpopulated as a formal artifact — should be back-filled from `openapi.json` so the next dependent design doesn't re-verify the same contract from scratch.
- `addnewversion`'s `403` response has **no schema** in the contract (`content: {"application/json": {}}`), unlike every other error response here (400/404/500 all reference `ApiResponse`) — worth the backend team's awareness that a client can't safely parse a message out of it today, only branch on status code.
- This design's exercise-name lookup depends on FT-002 exposing a `getall`-sourced function returning at least `{id, name}` per exercise — FT-002's own Design stage should confirm that shape holds so the two compose without rework.
- Reiterating the Analyst's own flag with full agreement: no update/delete/get-by-id/version-history endpoints exist at all on `training-planning-service`. This permanently shapes the UX (no way to browse past versions, no true delete) — not blocking this design, but worth central visibility as the contract matures.

## Review (Developer peer review + Frontend Architect conformance review)

### Verdict: SEND BACK (one required fix; everything else approved)

Reviewed as a different developer than implemented this feature, per this repo's peer-review split.

### Checks performed

1. **`{value: uuid}` wrapping / bare strings** — confirmed correct. `workoutApi.ts`'s `createWorkout`/`listWorkouts` send/receive bare uuid strings throughout; `addWorkoutVersion` (line ~107) is the *only* place `{ workoutId: { value: workoutId } }` is constructed — matches the design's "one and only place" claim exactly. `403` is handled as a fixed branch (`response.status === 403` checked *before* `readErrorMessage` is ever called) returning `WorkoutApiError('FORBIDDEN', "You don't own this workout.")` with no body parsing — correct given the contract's schema-less 403.
2. **Reuse of FT-002's exercise picker** — confirmed. `WorkoutsPage.tsx` and `WorkoutDetails.tsx` both `import { listExercises } from '../lib/api/exerciseApi'` (FT-002's real module) — no duplicate fetch mechanism was introduced. `WorkoutForm.tsx` receives the resulting `Exercise[]` as a prop and only does client-side name filtering, as designed.
3. **No nav entry point to `/workouts`** — confirmed true, and this is the one blocking finding. `AppHeader.tsx` links only to `/exercises` and a logout button; nothing links to `/workouts`. The Design's own "Summary of new/changed files" list (line ~162-168) never mentions `AppHeader.tsx`, so the implementer built exactly what was designed — this is a design gap, not an implementer error. But it makes the feature unreachable from the app's normal flow: a logged-in user has no click-path from `/` or the header to the new list/create/search screen, only a typed URL. Compounding this, `RoutineDetail`'s mock-data `WorkoutCard` still links to `/workout/1` / `/workout/2` (untouched mock ids), which now 404s against "Workout non trovato" since `WorkoutDetail` reads from the real fetched `workouts` array — so that path doesn't accidentally compensate either. Given `AppHeader.tsx` already carries an exact precedent for this (FT-002 added the "Esercizi" link for `ExerciseLibrary`, its own new top-level page), the fix is a one-line, no-design-decision addition — a `Link to="/workouts"` next to "Esercizi" — not a follow-up worth deferring. Sending back for that addition (plus a design-doc correction to list `AppHeader.tsx` as a changed file) before conformance review.
4. **`App`/`AppContent` restructuring** — confirmed sound. `AppContent` now renders inside `AuthProvider`, so `useAuth()` is available for the `workouts` lift; the `ProtectedRoute` group (`/`, `/routine/:id`, `/workout/:id`, `/workouts`, `/exercises`) still gates on `isAuthenticated`/`isLoading` exactly as before, rendering `AppHeader` + `Outlet` unchanged. `git diff --stat -- Workout_React` confirms `RoutineCard.tsx` and `RoutineDetail.tsx` do not appear in the diff at all (untouched); `ExerciseLibrary.tsx`/`ExerciseLibraryItem.tsx` are untracked additions from FT-002, not modified by this diff. `ExerciseItem.tsx`'s 4-line change is a mechanical prop-type rename (`Exercise` → `WorkoutExercise`), forced by `Exercise` now meaning the real exercise-service entity — no JSX/behavior change. `ExerciseForm.tsx`'s changes are unrelated FT-002 work, not touched by this feature.
5. **Build/lint** — ran independently in `my-frontend/`: `npm run build` (`tsc -b && vite build`) succeeds clean; `npm run lint` (`eslint .`) reports zero errors/warnings.

### Other notes (non-blocking)

- Error-code branching (`VALIDATION_ERROR`/`NOT_FOUND`/`FORBIDDEN`/`UNKNOWN_ERROR`) matches the design's status-code table exactly for all three endpoints.
- `WorkoutForm`'s create/edit shared-modal, `sequence`-from-index, and re-fetch-after-write (`refreshWorkouts`) all match the design as written.
- The `RoutineDetail` → `/workout/:id` dead-link regression above (mock routine ids vs. real fetched workouts) is a byproduct of Routines staying mock while Workouts went real — acceptable for now since Routine wiring is explicitly out of this feature's scope, but worth the Architect flagging forward so it isn't rediscovered as a surprise bug when Routines are wired next.

**Action for resubmission**: add one `Link` to `/workouts` in `AppHeader.tsx` (mirroring the existing `/exercises` link), update the Design's file list accordingly, then return for conformance review.

### Frontend Architect conformance review

**Verdict: CONFORMS — approved to proceed to Central Architect Gate.**

Send-back fix confirmed landed: `AppHeader.tsx` now renders `<Link to="/workouts">` (ClipboardList icon, "Workout" label) alongside the pre-existing `/exercises` link — the one-line addition the peer review required. Independently re-ran `npm run build` (`tsc -b && vite build` — clean) and `npm run lint` (`eslint .` — zero errors/warnings) against the current working tree; both pass, consistent with the "clean build/lint" verification noted for the fix.

One part of the requested resubmission did **not** land: "update the Design's file list accordingly." The Design section's "Summary of new/changed files" (above) still omits `AppHeader.tsx`. The code fix is correct and complete; only the doc correction is missing. Recording it here rather than editing `## Design` myself, since this touch point's remit is the `## Review` section only — flagging so it isn't silently lost, not withholding approval over it, since conformance gates on behavior/code matching the design, not on the design doc retroactively describing every downstream fix.

Per-file conformance against the Design section, verified directly against current code:

- **`workoutApi.ts`** — `{value: uuid}` wrap isolated to `addWorkoutVersion` only, bare uuid strings everywhere else; 403 branch checked and returns fixed `WorkoutApiError('FORBIDDEN', ...)` before any attempt to parse a body; 400/404 parse `errors[0]?.message`, 500 generic. Matches design exactly.
- **`types.ts`** — `Workout`/`WorkoutExerciseEntry` match the design's structural replacement verbatim; `Exercise`/`ExerciseSet` untouched and not repurposed, as specified.
- **`WorkoutForm.tsx`** — shared create/edit modal; edit mode shows `name` read-only; `sequence` derived from row index at submit; `groupId` omitted; on success calls `onSaved` (`refreshWorkouts`) then closes, no local resource construction from the write response. Matches.
- **`WorkoutList.tsx` / `WorkoutCard.tsx`** — list resurrected as presentational grid; `WorkoutCard`'s new `exerciseNames`/`onEdit` props are optional with safe defaults (`{}`, `undefined`); confirmed `RoutineDetail.tsx`'s call site is still exactly `<WorkoutCard workout={w} />` — no new props threaded, Pencil icon stays inert there as designed.
- **`WorkoutsPage.tsx`** — new `/workouts` route/container; client-side name-substring filter (no backend search param used); reuses FT-002's `listExercises`, no duplicate fetch mechanism, no new Context. Matches.
- **`WorkoutDetails.tsx`** — reads `workouts` prop instead of traversing `routines`; back-link corrected to `/workouts` unconditionally; Edit button added next to it; `ExerciseItem` projection matches the design's snippet exactly (`reps ?? 0`, `durationSeconds ?? 0`, `restSeconds` → `pauseSeconds ?? 0`). Matches.
- **`App.tsx`** — `workouts`/`refreshWorkouts` lifted state; `/workouts` route added inside the `ProtectedRoute` group; `/workout/:id` now receives `workouts` instead of `routines`. Matches. (The current working tree also carries later, out-of-scope routine-wiring changes layered on top of this diff — `App.tsx` comments reference "FT-004"; `RoutineDetail.tsx`/`RoutineCard.tsx` are mid-change for that separate feature. Not a conformance concern for this feature.)

### Central Architect Gate flags (carried forward + new)

- All four flags from the Design section's own "Central Architect Gate flags" stand unchanged and are re-forwarded (unpopulated `api-contracts.md`; schema-less `403` on `addnewversion`; FT-002 exercise-shape dependency; no update/delete/get-by-id/version-history endpoints on `training-planning-service`).
- New, minor: this doc's own Design section file list should still be corrected to add `AppHeader.tsx` — doc-hygiene only, not worth another send-back cycle.
- Reforwarding the peer review's own non-blocking note for visibility: confirm whether the `RoutineDetail` mock-data dead-link regression (real fetched `workouts` vs. stale mock routine workout ids) is resolved now that routine wiring appears to be landing in the working tree (FT-004), or is still open and should be tracked there.

---

## Central Architect Gate

**Verdict: Approve to merge.**

Reviewed for cross-service impact only (the earlier local send-back/resend cycle already resolved a scope gap, not a cross-service one).

- **No collateral effects found.** This feature's `workoutApi.ts` treats `training-planning-service` exactly as its contract documents (including correctly isolating the `{value: uuid}` wrap to one call site and treating the schema-less `403` as a fixed branch rather than guessing at a body shape). It reuses FT-002's real `listExercises` rather than inventing a second Exercise-fetch path — correct, no duplication of a concept `exercise-service` owns.
- **`addnewversion` gaps (no update/delete/get-by-id/version-history; schema-less `403`)**: legitimate backlog for `training-planning-service` itself, not a merge blocker for this client feature — the client already works around both gaps correctly. Recorded as new items 12–13 in `docs/services/training-planning-service/open-questions.md`, cross-referenced from here rather than duplicated.
- **`api-contracts.md` gate exception**: same judgement as FT-001/FT-002 — leave deferred, low-priority backfill already recorded centrally.
- **`ownerId`/`requestingUserId` mandatory-and-unverified**: same asymmetry/urgency note as FT-001, tracked there — not repeated as a new finding.
- **Design doc's file list still missing `AppHeader.tsx`, and the `routineApi.ts`/`workoutApi.ts` wrap-helper duplication**: both doc-hygiene / local code-quality items entirely within `web-client`. Out of this role's remit — noted so they aren't silently dropped, not adopted as central concerns. (The duplicated helper is the same item FT-004's conformance review flags; see that file's gate section — still just an intra-repo cleanup, not cross-service.)

No new cross-service concern rises to needing an ADR or a send-back. Approved.
