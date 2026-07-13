# FT-002 — Exercise Create/Update/List/Search

## Status

Requirements drafted (Frontend Analyst); pending Frontend Architect design.

## Requirements (Frontend Analyst)

### Summary

Wire Exercise create, update, list, and client-side search/filter against the real `exercise-service` (`Forma.Exercise/docs/engineering/openapi.json`, base URL `https://localhost:7225`, already declared as `EXERCISE_API_BASE_URL` in FT-001's design for `my-frontend/src/lib/api/config.ts`). Reuse FT-001's `authFetch`/`useAuth()` pattern for all calls rather than inventing a second one.

**Blocking dependency, not this feature's to resolve**: FT-001's own `## Status` line reads "Design complete; pending implementation (Frontend Developer)." I checked the actual repo state, not just the doc — `my-frontend/src/lib/api/`, `my-frontend/src/context/`, and any `Login`/`Register`/`AppHeader`/`ProtectedRoute` files do not exist yet in `my-frontend/src/`. `authFetch`, `config.ts`, `AuthContext`/`useAuth()` are all still design-only. This feature's requirements below assume those modules exist as FT-001 designed them (same base-URL-constants file, same wrapper), but that assumption only becomes true once FT-001 is actually implemented. Sequencing FT-001's Frontend Developer stage before this feature's is a real precondition, not a nice-to-have.

### Backend contract, as it constrains requirements

Endpoints (all under `/api/exercises`, tag `Exercises`):
- `POST /create` — body `CreateExerciseCommand {name, description, muscleGroups}` required; `ownerId` (uuid, nullable) and `parentId` (nullable) optional. 201 returns `{id}`; 400/500 return `ApiResponse` with an `errors[].message` list.
- `PUT /update` — body `UpdateExerciseCommand {exerciseId}` required; `name`/`description`/`muscleGroups` all optional (partial update). 200/400/404/500.
- `GET /{id}` — single exercise, returns `ExerciseQueryModel`. 200/400/404/500.
- `GET /getall` — returns `ExerciseQueryModel[]`. Has an *optional* `requestingUserId` query param (not required) — 200/500 only, no 400/404. **No server-side search/filter query parameter exists.** "Search" for this feature means filtering the already-fetched list client-side (by name, the only free-text field), not a new backend capability — confirmed against the contract, not assumed.
- `DELETE /{id}` — 200/400/404/500. Exists in the contract (see Delete section below).
- `POST /setparent`, `POST /clearparent`, `POST /createexerciseresource` — out of scope for this feature (hierarchy management and media resources aren't part of "create/update/list/search").

`ExerciseQueryModel` (the list/get shape): `id` (uuid), `name` (string, nullable), `description` (string, nullable), `muscleGroups` (array of the enum `Chest|Back|Legs|Shoulders|Arms|Core|FullBody`, nullable), `ownerId` (uuid, nullable — null means shared-library, non-null means private, per `Forma.Claude/docs/services/exercise-service/domain.md`). **There is no `sets`, `reps`, or any workout-composition field anywhere on this model.**

### `types.ts`'s existing `Exercise` is wrong for this data — plainly, not a workaround

`my-frontend/src/types.ts` currently defines one `Exercise` interface (`{id, name, sets: ExerciseSet[]}`) used for two different things at once: (a) the entry inside `Workout.exercises` (sets/reps/duration/pause — Workout-composition data, owned by `training-planning-service`, not this feature), and (b) what will need to be the real `exercise-service` entity (`name`, `description`, `muscleGroups`, `ownerId` — no sets at all). These cannot both be modeled by a single `Exercise` type once real data replaces the mock: a library Exercise has no sets, and a Workout's composed-exercise entry has no `description`/`muscleGroups`. This is a genuine type-design fork, not a naming detail — flagging for the Frontend Architect to resolve (e.g., a real `Exercise` matching `ExerciseQueryModel`, and a separately-named type for the Workout-composition entry, out of this feature's scope to design since that's `training-planning-service` data). Do not patch around it by adding optional fields to one shared interface.

### Structural mismatch: neither given component is currently an "Exercise library" screen

I read both components as they exist today, not from their names, plus how they're actually used in `App.tsx`/`WorkoutDetail.tsx`/`RoutineDetail.tsx`:

- **`ExerciseItem.tsx`** is rendered only inside `WorkoutDetail` (`workout.exercises.map(ex => <ExerciseItem exercise={ex} />)`) — i.e. it displays one exercise *as composed into a Workout*. Only its collapsed header (`initialExercise.name`) maps to anything `exercise-service` returns. Its entire expanded body (set count, per-set reps/duration/pause inputs, generic-rest toggle) edits data that has no counterpart on `ExerciseQueryModel` — that's Workout-composition data belonging to a different, not-yet-wired service. Directly "wiring" that body to `exercise-service` isn't possible; there's nothing on the backend to bind it to.
- **`ExerciseForm.tsx`** is not rendered anywhere in `App.tsx` today — it's a standalone, currently-unused component with a single `name` input and an `onSave(name)` callback.
- **No route/page for browsing an Exercise library exists at all** (confirmed: `App.tsx`'s only routes are `/`, `/routine/:id`, `/workout/:id`; `WorkoutList.tsx` is entirely commented-out dead code). A list with client-side search/filter, plus a place to trigger create/update/delete, has nowhere to live today.

This means satisfying "list (with client-side search/filter)" and giving `ExerciseForm` somewhere to be submitted from requires **a new container/page**, not just new data flowing into existing JSX. Per this repo's own precedent (FT-001 explicitly built new Login/Register screens when the feature genuinely required it, flagging that as a named exception rather than scope creep), I'm flagging the same kind of exception here rather than deciding it's out of scope myself — a bare list of `ExerciseItem` headers plus `ExerciseForm` needs a new page/route to exist in, built from the app's existing visual language, not a new design system. Deciding what that container looks like and how minimal it can stay is the Frontend Architect's call, not mine.

Consequence for `ExerciseItem` specifically: this feature can wire its header (name, and reusing its expand/collapse shell) to real list data; its sets/reps/pause body should stay exactly as-is (local mock state, no backend call) since there's nothing to wire it to — that's a future Workout-composition feature against `training-planning-service`, not this one.

### Create

`ExerciseForm` only captures `name`; `CreateExerciseCommand` requires `name`, `description`, and `muscleGroups` (non-empty per the "required" list, though the schema still marks each nullable — the Architect/backend-validator behavior on an empty array isn't specified in the contract and shouldn't be guessed at here). Satisfying create therefore needs `description` and `muscleGroups` inputs added to the form — a minimal, necessary field addition to capture required data, same category of change as FT-001's new screens, not a redesign. Whether `muscleGroups` is a checkbox group, multi-select, etc. is a design/implementation call, not mine.

**Flagging, not deciding**: should a created Exercise get `ownerId` set to the logged-in `user.id` (private to that user) or left `null` (shared library)? The backend supports either (field is optional/nullable) — this is a product/business default, not a client wiring detail. `Forma.Claude/docs/services/exercise-service/open-questions.md` item 1 ("who governs the shared library beyond a user promoting their own") is the same unresolved question from the owning side. I'm not picking a default.

### Update

`UpdateExerciseCommand` needs `exerciseId` plus whichever of `name`/`description`/`muscleGroups` changed (partial update supported). Per the structural mismatch above, there's no existing UI surface in `ExerciseItem`/`ExerciseForm` that displays/edits `description` or `muscleGroups` today — the Architect needs to decide whether update reuses `ExerciseForm` (pre-filled, in an edit mode) or another surface within the new list container. Not deciding the mechanism, only noting the requirement: name/description/muscleGroups must all be editable, since `UpdateExerciseCommand` supports changing all three and nothing in the domain model restricts update to name-only.

Per `Forma.Claude/docs/services/exercise-service/domain.md`, `Update` does not touch `ownerId` or `parentId` (dedicated operations) — this feature's update UI should not attempt to change ownership or hierarchy.

### List + client-side search/filter

Fetch via `GET /getall`, render as a list of `ExerciseItem`-header-shaped rows in the new container above. Filter client-side by `name` substring match against the already-fetched array — the only free-text field on `ExerciseQueryModel`. `muscleGroups` could plausibly also be a client-side filter facet (finite enum, already present on each fetched row) — flagging as a reasonable extension of "search/filter" the Architect may choose to include, not a hard requirement from the request as stated.

**Flagging, not deciding**: whether to pass the logged-in `user.id` as `requestingUserId` on `getall`. The contract doesn't document what this parameter actually filters (own-private-plus-shared vs. something else) — that's an `exercise-service` behavior question, not something to infer here. Separately, per `Forma.Claude/docs/services/web-client/open-questions.md` item 5, `exercise-service` doesn't verify a caller-supplied id against the JWT yet, so whatever the client sends is meaningful today but not actually enforced — already tracked there, not a new risk this feature introduces.

### Delete — realistic to include, with two caveats to flag

`DELETE /api/exercises/{id}` exists in the contract (200/400/404/500) — unlike a feature that needs a backend change, this one doesn't. Two things worth surfacing before design commits to it:

1. **Domain constraint, already enforced server-side**: per `Forma.Exercise/docs/features/FT-003-update-delete.md`, deleting an Exercise that has hierarchy children is rejected with a domain-level 400 (`ApiResponse.errors[].message`), not silently allowed or a raw 500. The client does not need to pre-check for children (no endpoint exposes that cheaply anyway) — it only needs to display whatever message the 400 response carries, same error-handling shape as create/update failures.
2. **Cross-service safeguard not live yet**: `Forma.Claude/docs/services/exercise-service/open-questions.md` item 13 records that deleting an Exercise referenced by a `training-planning-service` Workout is *supposed* to be blocked (ADR-006, accepted), but the reference-check call isn't built yet on either side. Today's actual contract behavior is exactly what's documented above (blocks only on hierarchy children) — this is a backend-owned gap already tracked centrally, not something for this feature to work around or replicate client-side.

Neither `ExerciseItem` nor `ExerciseForm` currently has a delete affordance in their JSX — adding one (e.g., an icon button in the new list container's row, consistent with `ExerciseItem`'s existing `lucide-react` icon-button convention) is, again, the Architect's placement decision.

### Out of scope for this feature

- Any decision about ownership default on create, `requestingUserId` filtering semantics, or shared-library governance (see Flagging notes above) — `exercise-service`'s own Service Analyst's call.
- `setparent`/`clearparent` (hierarchy) and `createexerciseresource` (media) — not implied by "create/update/list/search."
- Wiring the Workout-composition (sets/reps/pause) body of `ExerciseItem` to any backend — no such data exists on `exercise-service`'s `Exercise`; that's a future `training-planning-service` feature.
- Any visual/layout redesign of `ExerciseItem`/`ExerciseForm` beyond the minimal field/affordance additions flagged above (description/muscleGroups inputs, a delete control, a new list container) needed to make required data capturable at all.

## Design (Frontend Architect)

### Contract used, and a gate note

Same precedent as FT-001: `Forma.Claude/docs/services/exercise-service/README.md` confirms `api-contracts.md` is still an unpopulated formal artifact there, which would normally stop this design per this role's hard gate. It doesn't apply cleanly here for the same reason it didn't for FT-001 — `Forma.Exercise/docs/engineering/openapi.json` is a generated/documented contract, not reverse-engineered controller code, and it's the same source the Frontend Analyst already cited. I read it directly and designed against it. Flagging again to Central Architect Gate (now for a second feature in a row): `docs/services/exercise-service/api-contracts.md` should be back-filled from this openapi.json.

One caveat worth carrying forward, not blocking: the `GET /api/exercises/{id}` operation is annotated in the openapi.json itself as "hand-authored against the live controller ... regenerate once available to confirm exact shape." This design doesn't need that endpoint at all (see List below), so the confidence gap doesn't touch anything built here — noting it only so it isn't rediscovered as a surprise if a future feature needs single-exercise fetch.

### Real gotcha found in the contract: `UpdateExerciseCommand.exerciseId` is a wrapped value object, not a bare string

`CreateExerciseCommand.ownerId` is `{"type": "string", "format": "uuid"}` — a plain GUID. But `UpdateExerciseCommand.exerciseId` (and `SetExerciseParentCommand`/`ClearExerciseParentCommand`, out of scope) is `$ref: ExerciseId`, which is its own schema: `{"value": "<uuid>"}`. The path parameter on `GET/DELETE /api/exercises/{id}` is a plain string — only the JSON *body* field wraps it. Concretely, the update request body must be:
```json
{ "exerciseId": { "value": "3fa8...": }, "name": "...", "description": "...", "muscleGroups": ["Chest"] }
```
not `{ "exerciseId": "3fa8..." }`. This is exactly the kind of asymmetry that's easy to miss when eyeballing the contract quickly — calling it out explicitly for the Frontend Developer so it isn't found the hard way against a 400/422.

### `types.ts`: resolve the fork by splitting, not patching

Per the Analyst's finding, one `Exercise` interface can't model both the library entity and a Workout's composed-exercise entry. Resolution: keep the name `Exercise` for the real `exercise-service` entity (it's the domain-owning concept per `Forma.Claude/docs/product/domain-model.md`'s "Exercise" section), and rename the existing composition-entry shape to `WorkoutExercise` (unchanged fields — this is a rename, not a redesign):

```ts
export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'FullBody';

// Was `Exercise` — the entry inside Workout.exercises (sets/reps/duration/pause,
// training-planning-service data). Shape unchanged, only the name changes.
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

// New — the real exercise-service entity, mirrors ExerciseQueryModel exactly
// (including its nullability) rather than inventing display defaults here.
export interface Exercise {
  id: string;
  name: string | null;
  description: string | null;
  muscleGroups: MuscleGroup[] | null;
  ownerId: string | null;
}
```
`Workout.exercises` becomes `WorkoutExercise[]` (was `Exercise[]`). Consumers the Frontend Developer will need to touch: `ExerciseItem.tsx`'s prop type (`exercise: WorkoutExercise`), `WorkoutCard.tsx`'s import, and `App.tsx`'s mock-data literals (structurally unaffected, only the imported type name if referenced). None of this changes `ExerciseItem`'s or `WorkoutCard`'s JSX — pure type-plumbing, per this role's boundary.

### `lib/api/exerciseApi.ts` — same shape as `authApi.ts`, own error type

New module, the only code that knows `exercise-service`'s endpoint/error shapes, following the `authApi.ts` precedent (typed error class, callers branch on it instead of raw `Response`):

```ts
export class ExerciseApiError extends Error {
  status: number;
  messages: string[]; // from ApiResponse.errors[].message; ['Something went wrong.'] if absent/empty
}

listExercises(): Promise<Exercise[]>
// GET ${EXERCISE_API_BASE_URL}/api/exercises/getall via authFetch.
// result is nullable per ApiResponseOfIEnumerableOfExerciseQueryModel -> default to [].
// requestingUserId query param intentionally omitted (see Flagging below).

createExercise(input: { name: string; description: string; muscleGroups: MuscleGroup[] }): Promise<{ id: string }>
// POST .../api/exercises/create via authFetch, JSON body = input as-is (ownerId/parentId omitted, see Flagging).
// 201 -> result.id from ApiResponseOfCreatedExerciseResponse.

updateExercise(input: { exerciseId: string; name?: string; description?: string; muscleGroups?: MuscleGroup[] }): Promise<void>
// PUT .../api/exercises/update via authFetch. Body wraps the id per the gotcha above:
// { exerciseId: { value: input.exerciseId }, name, description, muscleGroups }.
// Sends the form's full current name/description/muscleGroups every time (not a diff) —
// contract supports partial update, but resending everything is simpler to implement
// correctly and is semantically equivalent to a full update of those three fields.

deleteExercise(id: string): Promise<void>
// DELETE .../api/exercises/{id} via authFetch. Plain string id in the URL, no wrapping
// (path param, not the body — the gotcha above only applies to Update's JSON body).
```
All four go through `authFetch`/`EXERCISE_API_BASE_URL`, no second HTTP wrapper. On `!response.ok`, parse the body as `ApiResponse`, collect `errors[].message` into `ExerciseApiError.messages` (empty/unparseable body -> one generic fallback message), and throw. `GET /{id}` is deliberately not wired — List uses `getall`, and Update's edit form pre-fills from the already-fetched row in local state, so nothing in this feature needs the single-get endpoint (which conveniently sidesteps that endpoint's "shape not fully confirmed" caveat entirely).

**Flagging, not deciding (per Analyst)**: `createExercise` omits `ownerId` from the request body entirely rather than the client guessing a default — it's optional/nullable on the contract, and setting it either way (to `user.id` or explicit `null`) would be this client encoding a private-vs-shared business default that isn't this role's or this repo's to make. Same reasoning for `listExercises` omitting `requestingUserId` — its filtering semantics aren't documented. Both stay as open items on `exercise-service`'s side (`Forma.Claude/docs/services/exercise-service/open-questions.md` item 1), not solved by this wiring.

### New container page: `src/pages/ExerciseLibrary.tsx`, route `/exercises`

Neither existing component is reusable as the library screen (per Analyst), so this is a new page — same named exception FT-001 already established for new screens, built from the app's existing dark-theme visual language (`bg-gray-950`/`bg-gray-800`/`border-gray-700`/`rounded-lg`, `lucide-react` icons), not a new design system. Added to `App.tsx`'s protected route group alongside `/`, `/routine/:id`, `/workout/:id` (same `ProtectedRoute`/`AppHeader` wrapper, no new layout mechanism).

Structure:
- **Search/filter row**: a text input filtering the already-fetched array by `name` substring (case-insensitive), plus a row of toggle chips for the 7 `MuscleGroup` values — the Analyst flagged this as a reasonable extension of "search/filter" given it's a finite, already-fetched enum field; including it since it's essentially free once the list is in memory. Selecting multiple chips is OR semantics (matches any selected group). Both filters are local `useMemo` derivations over the fetched array — no new backend capability, matching the Analyst's finding that none exists.
- **List**: one row per `Exercise`, in a new small presentational component `src/components/Exercise/ExerciseLibraryItem.tsx` — visually mirrors `ExerciseItem`'s collapsed-header card shell (`bg-gray-800 border border-gray-700 rounded-xl`, name + chevron expand/collapse) since that's the closest existing precedent, but its expanded body shows `description`/`muscleGroups` read-only plus Edit (`Pencil`) and Delete (`Trash2`) icon buttons — not `ExerciseItem` itself, since that component's body is hardcoded to the sets-editing shape that no longer applies once `Exercise`/`WorkoutExercise` are split. This is a new component, not a modification of `ExerciseItem`.
- **Create/Edit form panel**: reuses `ExerciseForm`'s field-editing shape, extended per the Analyst's finding — add `description` (text input) and `muscleGroups` (checkbox group over the 7 fixed enum values, the simplest control for a small fixed set, no new dependency). `ExerciseForm` gains an optional `initialValue?: Exercise` prop (pre-fills all three fields when editing) and its `onSave` signature becomes `onSave(input: { name; description; muscleGroups })` — the container decides create-vs-update by whether it opened the panel with an `initialValue`. A "New Exercise" button opens the panel empty; each row's Edit icon opens it pre-filled. On successful save, the container closes the panel and reloads the list via `listExercises()` (simplest-correct approach — re-fetching rather than hand-merging local state).

**Styling note, flagging a tension rather than silently resolving it either way**: FT-001's design explicitly said `ExerciseForm`'s light theme (`bg-gray-50`, plain borders) is inconsistent with the rest of the app and shouldn't be used as a *reference* for new screens. This feature's instruction is the opposite direction — reuse `ExerciseForm`'s existing field shape rather than restyling it. I'm keeping `ExerciseForm`'s existing light-theme classes as-is on the new `description`/`muscleGroups` fields (consistent with itself, and this role doesn't redesign CSS), which means the form panel will render as a light card inside an otherwise dark-themed page. That visual inconsistency is pre-existing (inherited from `ExerciseForm` as originally built), not introduced by this design — flagging it to Central Architect Gate rather than deciding unilaterally to restyle it, since restyling is explicitly out of this role's remit.

- **Delete**: the row's `Trash2` button calls `deleteExercise(id)` after a native `window.confirm` (a UX safety net, not domain validation — no business rule invented). On success, reload the list.

### Delete's hierarchy-children 400: surfaced verbatim, not re-interpreted

Per `Forma.Exercise/docs/features/FT-003-update-delete.md`, the domain guard throws `DomainArgumentException("Cannot delete an exercise that has children in the hierarchy.")`, which the backend's exception filter turns into a 400 `ApiResponse` with that string in `errors[].message`. The client does exactly what the Analyst specified: display whatever message the response carries, using the same error-handling shape as create/update. Concretely, `ExerciseLibrary.tsx` holds one page-level `error: string[] | null` state (populated from `ExerciseApiError.messages`, whichever of create/update/delete last failed), rendered as a dismissible red-text banner at the top of the page — the same `text-red-400 text-sm` convention already used on `Login.tsx`/`Register.tsx`, not a new toast/modal mechanism. No client-side pre-check for children is attempted (none is cheaply possible, per the Analyst) — the 400 is the first and only signal, exactly as the backend models it.

### Navigation entry point

No page currently links to `/exercises` — without an entry point the route would be unreachable. Minimal necessary addition: one `Link to="/exercises"` inside the existing `AppHeader.tsx`, between the email and the logout button, styled with the same `text-[10px] uppercase font-bold text-gray-400 hover:text-white transition-colors` convention already used there, with a `Dumbbell` icon (`lucide-react`, same icon-sizing convention as `LogOut`). This touches an existing component, so flagging it explicitly rather than treating it as implicitly in-scope: it's the same category of "chrome needed for a new screen to be reachable at all" that FT-001 already established when it introduced `AppHeader` itself, not a layout redesign.

### Summary of new/changed files (design-level; Frontend Developer owns actual implementation)

- `src/lib/api/exerciseApi.ts` (new)
- `src/types.ts`: split `Exercise` -> `Exercise` (library) + `WorkoutExercise` (composition, renamed), add `MuscleGroup`; `Workout.exercises: WorkoutExercise[]`
- `src/components/Exercise/ExerciseItem.tsx`: prop type only (`WorkoutExercise`), no JSX change
- `src/components/Exercise/ExerciseForm.tsx`: add `description`/`muscleGroups` fields + `initialValue` prop, extend `onSave` signature — existing light-theme classes preserved, extended in kind
- `src/components/Exercise/ExerciseLibraryItem.tsx` (new)
- `src/pages/ExerciseLibrary.tsx` (new)
- `src/components/Layout/AppHeader.tsx`: add one nav `Link` to `/exercises`
- `src/App.tsx`: add `/exercises` route inside the existing protected route group

## Review (Developer peer review + Frontend Architect conformance review)

Reviewed as a peer (did not implement this feature). Verified against the design section above, not just trusted the implementer's inline comments.

**The flagged gotcha — verified correct.** `exerciseApi.ts` `updateExercise` sends `exerciseId: { value: input.exerciseId }` in the PUT body exactly as specified. `createExercise` sends a bare `input` object (no `exerciseId` at all — correct, Create doesn't have one). `deleteExercise` uses the plain string `id` in the URL path, unwrapped, per the "path param, not body" distinction. All three match the design's asymmetry exactly.

**Plumbing reuse — confirmed.** `exerciseApi.ts` imports `authFetch` from `./authFetch` and `EXERCISE_API_BASE_URL` from `./config`, both FT-001 artifacts; no second HTTP wrapper invented. Error handling mirrors `authApi.ts`'s typed-error-class precedent (`ExerciseApiError` with `status`/`messages`).

**Layout/graphics scope — clean.** `git diff --stat -- Workout_React` shows only `App.tsx`, `ExerciseForm.tsx`, `ExerciseItem.tsx`, `types.ts` modified (plus new files); `RoutineCard.tsx`, `WorkoutCard.tsx`, `WorkoutList.tsx`, `RoutineDetail.tsx`, `WorkoutDetails.tsx` show zero diff — confirmed with an explicit `git diff --stat` scoped to those five paths (empty output). `ExerciseItem.tsx`'s diff is exactly two lines: the type import (`Exercise`→`WorkoutExercise`) and the prop type annotation — no JSX/styling touched, implementer's claim verified rather than trusted. `ExerciseForm.tsx`'s diff adds the `description` textarea and `muscleGroups` checkboxes using the same pre-existing light-theme classes (`bg-gray-50` etc.) — consistent with itself, no restyle attempted; the light-card-in-dark-page tension is correctly flagged rather than silently fixed. `AppHeader.tsx` (new, FT-001-owned file) carries the one added `Link` to `/exercises` as designed, positioned between email and logout.

**Types — split applied correctly and used consistently.** `types.ts` renames the composition entry to `WorkoutExercise` (fields unchanged) and adds a distinct `Exercise` mirroring `ExerciseQueryModel`'s nullability. `ExerciseItem.tsx`, `WorkoutDetails.tsx`, `WorkoutCard.tsx` all consume `WorkoutExercise` (the latter two via inference off `Workout.exercises`, no stale `Exercise` references — confirmed by grep and by a clean `tsc -b` build). `ExerciseLibrary.tsx`/`ExerciseLibraryItem.tsx`/`ExerciseForm.tsx`/`exerciseApi.ts` consistently use the new `Exercise`.

**React/TS correctness.** Hooks rules are respected: `useEffect` has an empty dep array with an inner `load` function (matches `AuthContext`'s hydrate pattern, satisfies `react-hooks/set-state-in-effect`); `useMemo` deps (`exercises, search, selectedGroups`) are complete. `key={editingExercise?.id ?? 'new'}` on `ExerciseForm` correctly forces remount so internal field state resets between create/edit/different-row-edit — a real, deliberate fix for a common stale-state bug, not incidental. Error state is cleared before each mutating action and populated from `ExerciseApiError.messages` with a generic fallback otherwise, matching the design's single page-level `error: string[] | null` banner.

**Independent verification.** Ran `npm run build` (`tsc -b && vite build`) and `npm run lint` (`eslint .`) in `my-frontend/` myself — both clean, zero errors/warnings.

**Verdict: Approve.** Implementation conforms to the design, the flagged wrapping gotcha is handled correctly, no unrequested visual/layout changes were found, build and lint are clean. No blocking issues. Non-blocking, already-flagged-by-design items (ownership default on create, `requestingUserId` semantics, `ExerciseForm`'s light-theme-in-dark-page inconsistency) correctly remain undecided here, per this role's boundary — forwarding to Central Architect Gate as the design already recommended.

### Frontend Architect conformance review

Read this design section against the implementation directly (not re-running the peer's code-quality checks above). Checked each specific decision this design made, not implementation quality generally.

**`exerciseApi.ts`'s four functions and the wrap-on-update-only gotcha — matches the design exactly.** `listExercises`/`createExercise`/`updateExercise`/`deleteExercise` are present with the designed signatures. `createExercise` posts `input` as-is (`ownerId`/`parentId` omitted, per the flagged non-decision). `updateExercise` is the only call that wraps the id, as `{ exerciseId: { value: input.exerciseId }, ... }`; `deleteExercise` uses the bare `id` in the URL path. `GET /{id}` was correctly left unwired, as designed. `requestingUserId` is correctly omitted from `getall`. Error handling (`ExerciseApiError`, `errors[].message` → fallback) matches the designed shape.

**`Exercise`/`WorkoutExercise` split — verbatim.** `types.ts` matches the proposed snippet field-for-field, including `Exercise`'s nullability and the `MuscleGroup` union. `Workout.exercises` is `WorkoutExercise[]`. `ExerciseItem.tsx`'s diff is exactly the designed two-line type-plumbing change — confirmed via `git diff`, no JSX touched.

**`ExerciseLibrary.tsx`'s search+filter+CRUD shape — matches.** Name substring filter (case-insensitive) and muscle-group chip toggles (OR semantics via `.some`) are both local `useMemo` derivations, as designed. Create/Edit reuses `ExerciseForm` via `initialValue`, decides create-vs-update by its presence, and reloads the list via `listExercises()` on success rather than hand-merging state — matches "simplest-correct" call in the design. Route added inside the existing protected group; `AppHeader`'s new `Link` sits between email and logout with matching icon-sizing convention, as specified.

**Delete-error surfacing — matches, with one minor observation.** A single page-level `errors: string[] | null` populated from `ExerciseApiError.messages`, cleared before each mutating action, renders the 400 body verbatim (no client-side re-interpretation, no pre-check for hierarchy children) — as designed. One small deviation from the letter of the design: the banner is wrapped in a bordered box (`bg-gray-900 border-red-900/50 rounded-lg p-3`) with a dismiss control, rather than the bare `<p className="text-red-400 text-sm">` the design cited from `Login.tsx`/`Register.tsx`. The design did call for "dismissible," which the cited precedent doesn't have, so some container was unavoidable — but the extra box styling is a small addition beyond the literal citation. Not a toast/modal, not blocking, flagging only for completeness.

**`ExerciseForm` reused, not rewritten — confirmed.** The original `name` field (label, input, classes, placeholder) is byte-for-byte unchanged; `description`/`muscleGroups` were added using the same existing light-theme class patterns, extended in kind, not restyled. One incidental behavior addition not spelled out in the design: the submit button label now switches between `'Salva'`/`'Aggiungi'` based on whether `initialValue` is set. That's a content/wiring decision tracking create-vs-edit mode (not a JSX structural or CSS change) and is a reasonable, minimal consequence of adding edit support — noted, not a conformance issue.

**Conformance verdict: Approve.** Every specific decision this design made — the four-function API shape and its one wrapped field, the type split, the new page's search/filter/CRUD structure, the delete-error surfacing approach, and reusing (not rewriting) `ExerciseForm` — is implemented as designed. No new items to add to Central Architect Gate beyond what the design already flagged (ownership default on create, `requestingUserId` semantics, `ExerciseForm`'s light-theme-in-dark-page tension, backfilling `exercise-service/api-contracts.md`); optionally worth a one-line mention there that the error banner grew a bordered container beyond its cited precedent, as the lowest-priority item in that list.

---

## Central Architect Gate

**Verdict: Approve to merge.**

Reviewed for cross-service impact only.

- **No collateral effects found.** `Exercise`/`WorkoutExercise` split correctly keeps the real `exercise-service` shape (`ExerciseQueryModel`) separate from the Workout-composition shape that belongs to `training-planning-service`; nothing here duplicates or reinterprets a concept another service owns. `deleteExercise` surfaces the domain-level 400 verbatim rather than re-implementing the hierarchy-children rule client-side, correctly deferring to `exercise-service`.
- **`api-contracts.md` gate exception**: same judgement as FT-001 — leave `docs/services/exercise-service/api-contracts.md` deferred for now, low-priority backfill recorded centrally (`docs/services/web-client/open-questions.md` #1), not blocking.
- **Ownership default on create / `requestingUserId` filtering semantics**: correctly left undecided by this client — both are already tracked as `exercise-service`'s own open question (`docs/services/exercise-service/open-questions.md` #1). No new central action needed; this feature's flag to that item is exactly right and not duplicated here.
- **`ownerId` optional/nullable vs. `training-planning-service`'s mandatory `ownerId`**: same asymmetry noted under FT-001, tracked there — not repeated as a new finding.
- **`ExerciseForm`'s light-theme-in-dark-page tension and the error banner's extra bordered container**: pure client-side presentation, entirely within `web-client`. Out of this role's remit (cross-service impact, not local UI consistency) — noted here explicitly so it isn't silently dropped, but not adopted as a central concern.

No new cross-service concern rises to needing an ADR or a send-back. Approved.
