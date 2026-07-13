# FT-004 — Routine Create/List/Search

## Status

Design complete (Frontend Architect); pending implementation (Frontend Developer).

## Requirements (Frontend Analyst)

### Summary

Wire the existing Routine UI — `RoutineCard.tsx`, `RoutineDetail.tsx`, and the routine-list rendering currently inline in `App.tsx`'s `/` route (mock `initialRoutines` array + `useState`) — to the real `training-planning-service` backend for **create** and **list**, with **client-side** search/filter (the contract has no server-side search parameter). This replaces mock data with real `POST /api/routines/create` and `GET /api/routines/getall` calls.

### Hard precondition: this feature cannot be built yet

`AuthContext.tsx`, `authFetch.ts`, `token.ts`, and `config.ts` — the modules FT-001 designed to get a logged-in user's id and attach it to calls — **do not exist in the repository yet**. I checked (`my-frontend/src/lib/api/`, `my-frontend/src/context/` are both empty/absent). `docs/features/FT-001-auth.md`'s own Status line confirms this: "Design complete; pending implementation." `App.tsx` also still renders its old unprotected route tree with hardcoded mock data — no `ProtectedRoute`/`AuthProvider` wrapping exists today either.

Both backend calls this feature needs are hard-blocked without a real user id: `CreateRoutineCommand.ownerId` and `getall`'s `requestingUserId` query param are both in the schema's `required` list (confirmed directly against `Forma.Planner/docs/engineering/openapi.json`) — there is no anonymous/omitted-id path. **This feature is only usable while logged in, and only buildable once FT-001's Frontend Developer stage has actually landed `useAuth()`/`authFetch`/`config.ts`.** Stating this explicitly rather than assuming FT-001 "has landed" per the request's phrasing — it hasn't yet, only been designed.

### Real backend contract (read directly, not assumed)

`POST /api/routines/create` — body is `CreateRoutineCommand`:
- `ownerId` (uuid, **required**) — must be `user.id` from `useAuth()`.
- `name` (string, max 100, **required**).
- `entries` (array of `RoutineEntryDto`, **required**): each `{ workoutId, dayOfWeek, sequence }` where `sequence` (int) is **required** and `dayOfWeek` (nullable int) is optional.
- Response 201: `{ result: { id: <uuid> }, success, ... }`.

`GET /api/routines/getall?requestingUserId=<uuid>` — no other filter/search param exists, only `requestingUserId` (required) and `api-version`. Response wraps `RoutineQueryModel[]`: `{ id, ownerId, name, entries: RoutineEntryQueryModel[] }` where each entry is `{ workoutId, dayOfWeek, sequence }`.

**Contract quirk worth flagging to the Architect, not deciding here**: `RoutineEntryDto.workoutId` (used on *create*) is typed as `WorkoutId`, an object `{ value: <uuid> }` — not a bare uuid string. `RoutineEntryQueryModel.workoutId` (used on *list*) is a plain uuid string. Same conceptual field, two different wire shapes depending on direction. The create-request builder needs to serialize the wrapped form or the call will fail schema validation.

**No endpoints exist for**: fetching a single Routine by id, update, or delete (confirmed against both the openapi paths and `Forma.Claude/docs/services/training-planning-service/domain.md`'s "what this service still needs to build"). `RoutineDetail.tsx` currently does `routines.find(r => r.id === id)` against a props-passed array — that pattern (resolve from an already-fetched list, not a per-id backend call) still holds, since there's nothing else to call.

### The current `Routine` type is stale — real shape has no embedded Workout data

`my-frontend/src/types.ts`'s `Routine { id, name, workouts: Workout[] }` embeds full `Workout` objects (which themselves embed full `Exercise`/`ExerciseSet` objects). The real `RoutineQueryModel` has none of that — only `entries: [{ workoutId, dayOfWeek, sequence }]`, i.e. a reference by id plus scheduling metadata, nothing else. This is exactly what `Forma.Claude/docs/product/domain-model.md` and `training-planning-service/domain.md` say a Routine must do ("reference Workouts, not duplicate their detail," "references a Workout live — always the latest version"). I'm not proposing the new TypeScript shape (Frontend Architect's call) — just confirming plainly that the current one doesn't match the contract and needs revision.

### Consequence: both existing components need Workout data the Routine response doesn't carry

- `RoutineCard.tsx` currently computes its subtitle ("X Workout • Y Esercizi totali") from `routine.workouts.length` and a reduce over `workouts[].exercises.length`. With the real shape, workout count is `entries.length` directly, but "total exercises" has no source in the Routine response at all — it requires resolving each entry's `workoutId` against real Workout data (from `GET /api/workouts/getall`, same service, also mandatory `requestingUserId`) and summing *that* workout's exercise count.
- `RoutineDetail.tsx` currently does `routine.workouts.map(w => <WorkoutCard workout={w} />)`. `WorkoutCard` needs a full `Workout` (`title`, `exercises[].name`, etc.) — none of which is in `entries`. Rendering the existing page as-is requires resolving every entry's `workoutId` to full workout data via the same workout-list call.

Both are a real cross-endpoint join (Routine's `entries[].workoutId` → matching record in the Workout list), not a display-only remap. I'm flagging this as a requirement the design must account for (whether it fetches the full workout list once and indexes by id, or resolves lazily per routine) — not deciding the fetching strategy myself.

### Cross-feature dependency: creating a Routine requires picking *existing* Workouts

A Routine organizes Workouts, it doesn't create them. The create-Routine form therefore needs a way to pick from the user's *existing* Workouts (populating `entries[].workoutId`), which means calling this same service's `GET /api/workouts/getall?requestingUserId=...` — not inventing a workout inline. Workout creation is FT-003, running in parallel. Whether FT-004 wires its own read-only call to the workout list for this picker, or depends on FT-003 having already wired workout listing so it can be reused, is a genuine sequencing dependency between the two features. Flagging it; not resolving it here.

### Client-side search/filter

`getall` has no search/query parameter beyond `requestingUserId` — confirmed, only two query params exist on that endpoint. Search/filter must therefore run client-side against the already-fetched routine list. The only free-text field on `RoutineQueryModel` is `name`, so the baseline requirement is: filter the fetched list by case-insensitive substring match on `name`. If the entries→Workout join above gets built anyway (for the exercise-count/detail display), filtering by a referenced Workout's name becomes possible too — noting it as a natural extension, not a requirement, since it depends on a join decision I'm not making.

### Schedule fields (`dayOfWeek`, `sequence`) — do not over-build the create form

The create form must collect `sequence` (required int per entry) and may optionally collect `dayOfWeek`. Per `training-planning-service/domain.md`, this `dayOfWeek`-plus-`sequence` shape is explicitly called out as "a deliberately minimal, provisional scheduling placeholder," and `Forma.Claude/docs/product/domain-model.md` still lists open: "is a Routine's schedule a repeating pattern or bound to actual calendar dates?" I'm not asserting an answer or inventing a richer scheduling UI (e.g. a calendar-date picker) — the form should expose exactly what the contract accepts today (a per-entry day-of-week + ordering sequence), nothing more.

### New UI surface required (flagging, not designing)

Per this repo's "wiring only, don't redesign" mandate, but consistent with FT-001's precedent that a request needing UI that doesn't exist yet is allowed to add minimal new screens/components in the existing visual language:
- **No create-Routine UI exists anywhere today** — `App.tsx`'s `/` route only lists `RoutineCard`s, no create button/form. "Create" is explicitly requested, so some new form surface (name input, workout picker sourced per the dependency above, per-entry sequence/day inputs, submit) is required, not optional scope creep.
- **No search/filter input exists today** either on the `/` route. A new search box driving the client-side filter above is required.

I'm not deciding placement, layout, or whether it's a modal vs. a new route — that's the Frontend Architect's design call — only noting that unlike a pure "swap mock data for a fetch" feature, this one cannot be satisfied without *some* new UI element, same category of exception FT-001 already established.

### Known external blockers (not this feature's to fix)

- **No CORS configured** on `training-planning-service` for the Vite dev origin (`Forma.Claude/docs/services/web-client/open-questions.md` #6) — blocks actually exercising this feature against a live backend locally, same blocker FT-001 already flagged.
- **JWT not enforced yet** by `training-planning-service` (`open-questions.md` #5) — it currently trusts a caller-supplied `ownerId`/`requestingUserId` at face value. Sending `user.id` from `useAuth()` is meaningful (it's what the service expects) but not server-verified yet. Not a client-side gap to close here.

### Out of scope for this feature

- Deciding the Routine schedule model (recurring pattern vs. calendar dates) — open product question, not resolved by building this form.
- Deciding how the Routine↔Workout join (for exercise counts / detail rendering) is fetched — Frontend Architect's call.
- Resolving the FT-003/FT-004 workout-picker sequencing dependency — flagged above, not decided.
- Update/delete for Routines — no backend endpoint exists yet.
- Any visual/layout redesign of `RoutineCard`/`RoutineDetail` beyond the minimal new create-form and search-input surfaces identified above.

## Design (Frontend Architect)

### Contract used, and a gate note

`docs/services/training-planning-service/api-contracts.md` in `Forma.Claude` is still unpopulated (confirmed: only `README.md`/`domain.md`/`architecture.md`/`open-questions.md` exist there). Same precedent as FT-001: `Forma.Planner/docs/engineering/openapi.json` is a generated, versioned contract — not reverse-engineered controller code — and it's the same source the Analyst already cited. I read it directly and designed against `CreateRoutineCommand`, `RoutineEntryDto`, `RoutineQueryModel`, `RoutineEntryQueryModel`, `WorkoutId`, `WorkoutQueryModel`, and the `ApiResponse*` envelopes. Flagging again to Central Architect Gate: this is the second client design now depending on that openapi.json instead of a published `api-contracts.md`.

**FT-003 coordination note**: `docs/features/FT-003-workout-wiring.md` had only `## Requirements` when I read it — no `## Design` section existed yet to match. The naming/normalization/shape decisions below are my own best call, not a match against an FT-003 precedent that doesn't exist yet. Flagging reconciliation items for Central Architect Gate at the end rather than guessing what FT-003 will pick.

### `lib/api/routineApi.ts`

New module, same per-service-owns-its-endpoints pattern as `authApi.ts`:

```ts
export class RoutineApiError extends Error {}

interface RoutineEntryInput { workoutId: string; dayOfWeek: number | null; sequence: number }

// POST /api/routines/create. Wraps each entry's workoutId as {value: workoutId} to satisfy
// RoutineEntryDto.workoutId: WorkoutId (create direction only — see normalization note below).
// Parses ApiResponseOfCreatedRoutineResponse; throws RoutineApiError(errors[0]?.message ?? status
// fallback) when !response.ok || !success. Returns result.id.
export async function createRoutine(ownerId: string, name: string, entries: RoutineEntryInput[]): Promise<string>

// GET /api/routines/getall?requestingUserId=... . Maps ApiResponseOfIEnumerableOfRoutineQueryModel
// .result (RoutineQueryModel[] — entries[].workoutId already a bare uuid string here, no unwrap
// needed) 1:1 onto the Routine/RoutineEntry shape below. Same envelope check as createRoutine.
export async function getAllRoutines(requestingUserId: string): Promise<Routine[]>
```

Both use `authFetch` + `PLANNING_API_BASE_URL` (already declared in `config.ts` for exactly this).

### Normalizing the `{value: uuid}` vs bare-uuid `workoutId` trap

Confirmed directly in the schema: `RoutineEntryDto.workoutId` (create) is `WorkoutId {value: uuid}`; `RoutineEntryQueryModel.workoutId` (list) is a bare uuid string. FT-003 hits the identical trap (`AddWorkoutVersionCommand.workoutId` vs `WorkoutQueryModel.id`) but has no Design yet to match. Handling it locally: `createRoutine` wraps at the request-serialization boundary only (`{ workoutId: { value: entry.workoutId }, dayOfWeek, sequence }`); everywhere else in the app — `Routine.entries[].workoutId`, the workout-lookup map's keys, the create-form's draft state — uses the bare uuid string. The wrapped shape never leaks into `types.ts` or components.

**Central Architect Gate flag**: if FT-003's eventual Design introduces a shared wrap helper (e.g. `lib/api/shared.ts:toWorkoutIdDto`), `routineApi.ts` should adopt it instead of keeping an independent copy of the same three-line wrap — a conformance-review-time cleanup, not a blocker now.

### `types.ts` — real `Routine` shape, embedded `workouts` dropped

```ts
export interface RoutineEntry {
  workoutId: string;
  dayOfWeek: number | null;
  sequence: number;
}

export interface Routine {
  id: string;
  ownerId: string;
  name: string;
  entries: RoutineEntry[];
}
```

`Workout`/`Exercise`/`ExerciseSet` are untouched here — their revision is FT-003's scope, not this feature's.

### Join gap: each page fetches-all-and-indexes-by-id itself, no shared cache/context

`RoutineList` and `RoutineDetail` (the only two places needing Workout data) each call `getAllRoutines` and FT-003's workout-list function once on their own mount, and build a `Map<string, WorkoutSummary>` keyed by workout id via `useMemo`. Reasoning:
- Both `getall` endpoints are already "everything the user owns, no filter," and neither resource has a per-id endpoint — a full-list-then-index join is the only shape the contract supports, not a choice among several backend-side options.
- No new shared-state layer: this app has no state management beyond `useState` yet, and introducing a Context/cache to share one join across two routes would be exactly the premature complexity `CLAUDE.md`'s principles warn against for a two-page app with modest data volume. Trade-off accepted: list → detail navigation re-fetches both lists rather than reusing a cache; revisit only if that becomes a real, observed cost.
- This removes the need for `App.tsx` to hold any `routines`/`workouts` state or thread it as props at all.

**RoutineDetail**: fetch both, `routines.find(r => r.id === id)` (the Analyst's confirmed no-single-GET pattern still holds), sort that routine's `entries` by `.sequence` ascending, map each to `workoutsById.get(entry.workoutId)`, filter out misses (defensive — no delete endpoint exists, but nothing guarantees referential integrity client-side), render `<WorkoutCard key={w.id} workout={w} />` per resolved entry. Same JSX as today (`routine.workouts.map(...)` → resolved-entries `.map(...)`), only the data source changes.

**RoutineCard's exercise count**: computed in `RoutineList` (which already has `workoutsById`), not inside `RoutineCard`: `routine.entries.reduce((sum, e) => sum + (workoutsById.get(e.workoutId)?.exercises.length ?? 0), 0)`, passed down as a new `exerciseCount: number` prop. `RoutineCard` keeps rendering the same two numbers its JSX already shows (`routine.entries.length` replacing `routine.workouts.length`; the `exerciseCount` prop replacing its own internal reduce) — presentational component fed precomputed numbers, JSX/CSS untouched.

**Dependency on FT-003, not designed here**: the values in `workoutsById` need at minimum `{id, name}` (per this task's own scoping) plus something exercise-count-shaped for the reduce above. I'm specifying what FT-004 needs from FT-003's workout-list call, not FT-003's actual type — that's FT-003's Architect's decision. **Build-order flag for Central Architect Gate**: FT-004's exercise-count and `WorkoutCard`-nesting pieces cannot be fully implemented until FT-003 lands a real workout-list client function — a genuine sequencing dependency, not just a naming coincidence to reconcile later.

### Create-Routine UI

New `my-frontend/src/components/Routine/CreateRoutineForm.tsx`, rendered inline in `RoutineList` behind a "+ Nuova scheda" toggle button, in the existing dark-theme language (`bg-gray-800`/`border-gray-600`/`rounded-lg` card, white headings, `text-gray-400` secondary text, `blue-400` accent — the same palette `RoutineCard`/`Login`/`Register` already use, per FT-001's precedent for new-but-in-style UI).

- `name` — text input, `maxLength=100`, required; submit disabled while empty (the CLAUDE.md-permitted "disable a button" validation, nothing more).
- Workout picker — a checklist built from the same fetched workout list `RoutineList` already has; toggling adds/removes a workout from a local `entries` draft, showing only `name` per this task's "id + a display name is enough" scoping — no per-item detail preview (that would be scope creep beyond a picker).
- `sequence` — **not** a manual input. Derived automatically as 1-based position in the order workouts were added to the draft; no reorder UI. Justification: per `training-planning-service/domain.md`, `sequence`/`dayOfWeek` are explicitly "a deliberately minimal, provisional scheduling placeholder," with the recurring-vs-calendar question still open product-side — building reorder UI on top of a placeholder schema is exactly the premature complexity the project's principles warn against. A small, isolated addition later if the schedule model firms up.
- `dayOfWeek` — optional per-entry `<select>` next to each picked workout: "Nessun giorno" (`null`, default) or Monday–Sunday. **Assumption flagged, not verified**: the schema only documents `nullable int`, no enum values. I'm assuming .NET's `System.DayOfWeek` (Sunday=0..Saturday=6), the idiomatic default for a C# API, since nothing in the contract contradicts it. **Central Architect Gate should confirm this before the Frontend Developer hardcodes option values** — a wrong mapping silently mislabels every day.
- Submit → `createRoutine(user.id, name, entries)`; on success, close the form and re-run `getAllRoutines` (no created-routine detail comes back beyond `id` — same refetch-after-write pattern FT-003 already established for `addnewversion`); on `RoutineApiError`, show its message inline, same envelope-driven (`success`/`errors[].message`) handling FT-003 specified, not raw HTTP text.

### Routine list page: new `RoutineList.tsx`, replacing `App.tsx`'s inline JSX

Today's `/` route inlines `useState(initialRoutines)` directly in `App.tsx`. That no longer fits once it needs an authenticated dual fetch (routines + FT-003's workouts), loading/error state, client-side search, and the create-form above — more than a thin route table should own, and inconsistent with FT-001's own design note that `App.tsx` stays a route tree. Decision: new `my-frontend/src/pages/RoutineList.tsx`, same tier as the existing `RoutineDetail.tsx`/`WorkoutDetails.tsx` page components — not still inline, not a modal.

Owns: `useAuth()` for `user.id`; on mount, `getAllRoutines(user.id)` + FT-003's workout-list call (shared loading/error state); a `query` string driving client-side case-insensitive substring filter over `routine.name` (the only free-text field on `RoutineQueryModel` — the Analyst's baseline). The "filter by a referenced workout's name" extension the Analyst flagged as possible-but-optional is **not** built now: it wasn't requested, and the join above makes it a small later addition, not a redesign. Renders the search `<input>`, the "+ Nuova scheda" toggle + `CreateRoutineForm`, and the filtered `RoutineCard` list with the new `exerciseCount` prop — the same list-rendering JSX `App.tsx` has today, moved and fed real data.

### Summary of file changes

- New: `src/lib/api/routineApi.ts`, `src/pages/RoutineList.tsx`, `src/components/Routine/CreateRoutineForm.tsx`
- `src/types.ts`: `Routine` → `{id, ownerId, name, entries: RoutineEntry[]}`; new `RoutineEntry {workoutId, dayOfWeek, sequence}`
- `src/components/Routine/RoutineCard.tsx`: new `exerciseCount: number` prop replaces the internal `workouts` reduce; `routine.workouts.length` → `routine.entries.length`. JSX/CSS unchanged.
- `src/pages/RoutineDetail.tsx`: drop `routines` prop, self-fetch (routines + FT-003's workouts) via `useAuth()`, resolve via `.find()`, sort entries by `sequence`, resolve via `workoutsById` instead of `routine.workouts.map()`. JSX/CSS unchanged.
- `src/App.tsx`: drop `initialRoutines`/`useState`; `/` → `<RoutineList/>`; no `routines` prop threaded to any route (`/routine/:id`, `/workout/:id` become self-sufficient — the latter is FT-003's own concern to design, flagged not decided here).

### Flags for Central Architect Gate

1. `docs/services/training-planning-service/api-contracts.md` still unpopulated — second design (after FT-001's identity-service flag) depending on `openapi.json` directly; recommend back-filling now that two client designs need it.
2. FT-003's Design section didn't exist yet when this was authored — the `workoutId`-wrap-helper duplication and the exact workout-list function's shape/name both need reconciling once it lands (see normalization and join-gap sections above).
3. Genuine build-order dependency: FT-004's exercise-count and `WorkoutCard`-nesting pieces can't be implemented until FT-003 lands a real workout-list client function.
4. `dayOfWeek` integer mapping (assumed `System.DayOfWeek`, Sunday=0) is unconfirmed against the actual backend enum — verify before the Frontend Developer builds the day picker's option values.
5. Known external blockers carried forward unchanged from Requirements: no CORS configured on `training-planning-service` for the Vite dev origin; JWT not yet enforced server-side (`ownerId`/`requestingUserId` taken at face value).

## Review (Developer peer review + Frontend Architect conformance review)

### Verdict: APPROVED — proceed to conformance review

Reviewed as a different developer than implemented this feature, per this repo's peer-review split. No blocking issues found.

### Checks performed

1. **`{value: uuid}` wrapping / bare strings, vs. FT-003's exact pattern** — confirmed correct. `routineApi.ts`'s `createRoutine` (line ~57) is the *only* place `{ workoutId: { value: entry.workoutId } }` is constructed, built inline inside the request body at serialization time from a bare-string `entries: RoutineEntry[]` parameter; `getAllRoutines` maps the list response straight through with no unwrap needed (already bare). This is the identical isolated-wrap-at-the-boundary shape as `workoutApi.ts`'s `addWorkoutVersion` (`{ workoutId: { value: workoutId }, ... }`, line ~107) — same construct, same place in the call, same "everywhere else stays a bare string" invariant. `RoutineEntry`/`Routine` in `types.ts` and every component (`CreateRoutineForm`'s draft state, `workoutsById`'s keys, `RoutineDetail`'s `entries[].workoutId`) only ever see the bare uuid. One harmless deviation from the design's literal text: the design specified a locally-scoped `RoutineEntryInput` interface in `routineApi.ts`; the implementation reuses `types.ts`'s `RoutineEntry` directly for `createRoutine`'s parameter, since the two are structurally identical — avoids a redundant duplicate type, not a defect.
2. **Reuse of FT-003's `listWorkouts`/`Workout`** — confirmed, no duplicate fetch. `RoutineList.tsx` imports `listWorkouts` from `../lib/api/workoutApi` and fetches it alongside `getAllRoutines` via `Promise.all`; `CreateRoutineForm` receives the resulting `Workout[]` as a plain prop (`workouts={workouts}`) rather than fetching anything itself. `RoutineDetail.tsx` does the same dual-fetch independently (no shared cache, matching the design's explicit no-Context-yet decision).
3. **`RoutineCard.tsx` / `WorkoutCard.tsx` JSX/CSS** — verified via `git diff`, not the implementer's claim. `RoutineCard.tsx`'s diff is exactly: new `exerciseCount: number` prop replacing the internal `workouts.reduce`, `routine.workouts.length` → `routine.entries.length`, and one whitespace-only fix (`<Link ` trailing space removed) — no className/structural change. `WorkoutCard.tsx`'s diff (new optional `exerciseNames`/`onEdit` props, `workout.title` → `workout.name`, exercise-entry mapping) is FT-003's own change, not FT-004's — `RoutineDetail.tsx`'s call site is still exactly `<WorkoutCard key={w.id} workout={w} />`, no new props threaded, so FT-004 contributes zero JSX/CSS diff to `WorkoutCard.tsx`.
4. **Exercise-library/workout-form files untouched by this feature** — confirmed. `git diff --stat -- Workout_React` shows `ExerciseForm.tsx`/`ExerciseItem.tsx`/`WorkoutList.tsx`/`WorkoutDetails.tsx` as modified and `ExerciseLibrary.tsx`/`WorkoutForm.tsx`/`WorkoutsPage.tsx` as untracked additions, but all of that is FT-002/FT-003 territory layered into the same uncommitted working tree — none of it is FT-004's doing. Grepped the whole `src/` tree for `routine`/`Routine`: `ExerciseLibrary.tsx`, `ExerciseLibraryItem.tsx`, `ExerciseForm.tsx`, `WorkoutForm.tsx` have zero matches; `WorkoutsPage.tsx`/`WorkoutList.tsx`/`WorkoutDetails.tsx` have only comment-level mentions of the concept ("Routine-nested", "no longer necessarily reached through a Routine") with no functional coupling. Clean.
5. **`App.tsx` diff** — sound. Mock `initialRoutines` + its `useState` are fully gone; `/` now renders `<RoutineList />`; `<RoutineDetail />` takes no props (previously `routines={routines}`). FT-001's route-guard structure is intact: the same `ProtectedRoute` group (`/`, `/routine/:id`, `/workout/:id`, `/workouts`, `/exercises`) still gates on `isAuthenticated`/`isLoading` and renders `AppHeader` + `Outlet` unchanged; `/login`/`/register` still sit outside the guard. FT-003's `workouts`/`refreshWorkouts` lift in `AppContent` is untouched and still threaded to `/workout/:id` and `/workouts` — FT-004 correctly stopped threading `routines` anywhere instead of also dropping the (still-needed) `workouts` lift.
6. **React/TypeScript correctness** — hooks are sound: `RoutineList`'s mount effect declares its own `load` closure over `loadAll` and depends only on `[user]` (exhaustive-deps disabled deliberately, same "hydrate pattern" precedent as `ExerciseLibrary.tsx`/`AuthContext.tsx`); `RoutineDetail`'s effect is a plain one-shot dual-fetch on `[user]`. `RoutineDetail`'s `entries` sort is correct and non-mutating: `[...routine.entries].sort((a, b) => a.sequence - b.sequence)` (spreads before sorting the array pulled off state), then `.map(entry => workoutsById.get(entry.workoutId))`, then a proper type-guard filter (`(w): w is Workout => w !== undefined`) to drop unresolved references defensively. Both list/detail pages' `workoutsById` are correctly memoized on `[workouts]`. Minor non-blocking nit: `RoutineList.tsx` passes `ownerId={user!.id}` to `CreateRoutineForm` with a non-null assertion; this is safe in practice only because `ProtectedRoute` guarantees `isAuthenticated` (i.e. `user !== null`) before this component can mount, but the safety is external/implicit rather than a local guard — worth a future local narrowing if this pattern spreads, not worth a send-back here.
7. **Build/lint** — ran independently in `my-frontend/`: `npm run build` (`tsc -b && vite build`) succeeds clean (1797 modules, no errors). `npm run lint` (`eslint .`) reports zero errors/warnings.

### Other notes (non-blocking, carried to Central Architect Gate)

- The design's flagged wrap-helper duplication (`routineApi.ts` and `workoutApi.ts` each independently construct `{ value: uuid }` and each have their own near-identical `readErrorMessage`) is still present as-is — expected, since the design explicitly deferred this to conformance-review-time cleanup rather than blocking on it now.
- The `dayOfWeek` → `System.DayOfWeek` (Sunday=0) assumption is carried into `CreateRoutineForm.tsx`'s `DAYS_OF_WEEK` array with the same "unconfirmed, flag for Central Architect Gate" comment preserved from the design — not silently hardcoded without the caveat.
- External blockers (no CORS for the Vite dev origin, JWT not server-enforced) are unchanged and out of this feature's control, as scoped.

### Frontend Architect conformance review

**Verdict: CONFORMS — no send-back.** Read the Design section, the peer review, and the implementation directly (`routineApi.ts`, `types.ts`, `CreateRoutineForm.tsx`, `RoutineList.tsx`, `RoutineDetail.tsx`, `RoutineCard.tsx`, `App.tsx`), plus `workoutApi.ts` for the FT-003 comparison the design called for. Checked each specific decision this role made, not re-deriving the peer review's correctness/lint checks:

1. **`{value: uuid}` normalization vs. FT-003's exact pattern** — matches. `routineApi.ts`'s `createRoutine` builds `{ workoutId: { value: entry.workoutId }, dayOfWeek: entry.dayOfWeek, sequence: entry.sequence }` inline in the request body, byte-for-byte the same construct/location as `workoutApi.ts`'s `addWorkoutVersion` (`{ workoutId: { value: workoutId }, ... }`). `getAllRoutines` passes `entries[].workoutId` straight through unwrapped, as designed. No bare-vs-wrapped leak anywhere outside this one call site — `types.ts`, `CreateRoutineForm`'s `DraftEntry`, and both pages' `workoutsById` maps all use plain uuid strings throughout.
2. **`RoutineEntry`/`Routine` type shape** — verbatim match to the Design section's code block (`Routine {id, ownerId, name, entries}`, `RoutineEntry {workoutId, dayOfWeek, sequence}`). `Workout`/`Exercise` untouched, as scoped.
3. **Join-gap resolution** — matches exactly: `RoutineList` and `RoutineDetail` each independently call `getAllRoutines` + `listWorkouts` via their own `Promise.all` on mount, each builds its own `Map` via `useMemo([workouts])`. No Context/shared cache introduced anywhere in the diff — the no-premature-complexity call holds.
4. **Create-Routine UI shape** — matches: name input (`maxLength=100`, disables submit on empty, no other validation), workout checklist sourced from the `workouts` prop, `sequence` is not a field (derived as 1-based array index at submit time, no reorder UI), `dayOfWeek` is a per-entry `<select>` defaulting to "Nessun giorno"/`null` with the `System.DayOfWeek` (Sunday=0) assumption comment carried through unchanged, submit calls `createRoutine` then `onCreated` (refetch) then closes, errors rendered from `RoutineApiError.message` inline. Rendered behind a "+ Nuova scheda" toggle in `RoutineList`, in-style with the existing dark theme — matches the design's placement call.
5. **Routine list page location** — `src/pages/RoutineList.tsx`, same tier as `RoutineDetail.tsx`, not inline in `App.tsx` and not a modal, exactly as decided.
6. **`RoutineCard`/`App.tsx` diffs** — `exerciseCount` computed in `RoutineList` and passed down, `RoutineCard` JSX/CSS untouched beyond the two field-source swaps; `App.tsx` drops `initialRoutines`/`useState` entirely, threads no `routines` prop to any route, matching the design's stated file-change summary exactly.

**One accepted deviation** (already surfaced in peer review, concurring it's non-blocking): the design's pseudocode specified a locally-scoped `RoutineEntryInput` interface for `createRoutine`'s parameter; the implementation passes `RoutineEntry` from `types.ts` directly since the two are structurally identical. This doesn't introduce a shadow model and removes a redundant duplicate type — an improvement on the letter of the design, not a violation of its intent.

**Central Architect Gate**: all five flags from the Design section (unpopulated `training-planning-service/api-contracts.md`; the `workoutId`-wrap and `readErrorMessage` duplication between `routineApi.ts`/`workoutApi.ts`, now confirmed still independently duplicated rather than reconciled even though FT-003 has since landed a real Design — worth a follow-up cleanup ticket; the `System.DayOfWeek` Sunday=0 assumption, still unverified against the backend enum and now baked into shipped `CreateRoutineForm.tsx` option values; no CORS/JWT-not-enforced) remain open and are carried forward unchanged. Nothing new to add from conformance review itself.

---

## Central Architect Gate

**Verdict: Approve to merge.**

Reviewed for cross-service impact only.

- **No collateral effects found.** Routine wiring correctly normalizes the `workoutId` `{value}`-vs-bare-string asymmetry at one boundary, doesn't duplicate any `training-planning-service`-owned concept, and correctly treats "join Routine entries to Workout data" as a client-side concern rather than inventing a backend capability that doesn't exist.
- **`dayOfWeek` → `System.DayOfWeek` (Sunday=0) assumption**: this is the one item in this batch that's a genuine, actionable cross-service risk rather than a documentation nicety — if `training-planning-service`'s actual enum ordering differs, every day a user picks will be silently written wrong once this is exercised against a live backend. Not blocking merge now (CORS is still unconfigured, so nothing is live yet), but recorded as new item 13 in `docs/services/training-planning-service/open-questions.md`, recommending that service confirm the ordering before or immediately after CORS unblocks real testing.
- **`training-planning-service`'s missing update/delete/get-by-id/version-history endpoints and schema-less `403`**: same items already recorded under FT-003's gate section (`docs/services/training-planning-service/open-questions.md` #12) — this feature runs into the same "no get-by-id" gap and correctly works around it the same way (full-list + client index); not a new finding.
- **`routineApi.ts`/`workoutApi.ts` duplicated wrap/error-parsing helpers**: intra-`web-client` code quality, explicitly out of this role's remit (cross-service impact, not local code duplication). Noting it here so it isn't silently dropped — the conformance review already correctly logged it as a follow-up cleanup ticket local to `web-client`, not adopted as a central concern.
- **`api-contracts.md` gate exception / `ownerId`-`requestingUserId` asymmetry**: same judgement and tracking as FT-001–FT-003, not repeated as new findings.

No new cross-service concern rises to needing an ADR or a send-back. Approved.
