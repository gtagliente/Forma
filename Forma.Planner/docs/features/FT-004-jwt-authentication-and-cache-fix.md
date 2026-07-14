# FT-004 — JWT Bearer Authentication & GetAll Cache-Invalidation Fix

## Status

Built and verified (build-verified end to end; integration-test run blocked by a pre-existing,
unrelated defect in this repo's test scaffold — see Review section for details). Note: an
earlier pass through this file left the "Review" section asserting the cache-invalidation fix
(`WorkoutCacheKeys`/`RoutineCacheKeys`, the query-handler and event-handler edits) was already
complete when in fact only Problem 1 (JWT auth) had been implemented at that point —
`RoutineCacheKeys.cs` didn't exist yet and `GetAllWorkoutQueryHandler`/`GetAllRoutineQueryHandler`/
`WorkoutEventHandler`/`RoutineEventHandler` were still on the old unscoped/mismatched cache keys.
This was caught by re-verifying every claim against the actual working tree (`git status`/`git
diff`, direct file reads) rather than trusting the doc, and the cache fix has now actually been
built as described below.

## Requirements (Service Analyst)

### Source

Already decided centrally, not invented here: `../../../Forma.Claude/docs/architecture/adr/ADR-007-jwt-bearer-authentication.md`
(Accepted, product-owner sign-off) is the authoritative design for real authentication
replacing the caller-supplied stand-in this repo's own `docs/features/FT-001-workout-create.md`
/ `FT-002-workout-new-version.md` / `FT-003-routine-create.md` already flagged as temporary
("No auth exists yet, so this is caller-supplied" comments on `CreateWorkoutCommand.OwnerId`,
`AddWorkoutVersionCommand.OwnerId`, `CreateRoutineCommand.OwnerId`). No escalation to the
central Analyst needed — this closes a gap those features already named, it does not introduce
a new domain concept (Identity stays the minimal `User`, no roles/delegation, per ADR-007's own
scoping).

The sibling `exercise-service` repo (`Forma.Exercise`) implemented the same ADR as
`docs/features/FT-004-jwt-authentication-and-cache-fix.md` — used here as a structural and
technical precedent (same signing key/algorithm/claims, same `ICurrentUserAccessor` shape,
same options-validation wiring convention). **Key difference, applied not copied**: unlike
`exercise-service`, `Workout`/`Routine` here have **no shared-library concept** — every
Workout/Routine belongs to exactly one user (`OwnerId` is always a real, non-null Guid, never
null for "shared"). Per ADR-007 §Decision point 3/4, this means:

- **Every** endpoint requires `[Authorize]` — `Create`, `GetAll`, `AddNewVersion` (Workout),
  `Create`, `GetAll` (Routine). There is no anonymous-read path at all, unlike
  `exercise-service`'s `GetAll`/`GetById`.
- No `Shared` boolean flag is needed (nothing here is ever shared).
- No `GetById` exists yet on either controller — out of scope, not built by this feature.

A second, unrelated defect is fixed in the same pass because it was accepted at the same
central sign-off and touches the same handlers this feature already has to open:
`GetAllWorkoutQueryHandler`/`GetAllRoutineQueryHandler` cache their results under
`$"{nameof(GetAllWorkoutQuery)}:{request.RequestingUserId}"` /
`$"{nameof(GetAllRoutineQuery)}:{request.RequestingUserId}"`, but
`WorkoutEventHandler.ClearCacheAsync`/`RoutineEventHandler.ClearCacheAsync` invalidate only the
bare unscoped `nameof(...)` key — a silent no-op against the real (per-user-scoped) cache
entries, so a new Workout version or a new Routine doesn't show up in `GetAll` until the cache
TTL (2h absolute / 60s sliding) lapses.

### Functional requirements

1. **Authentication**: every request to `WorkoutsController.Create`/`GetAll`/`AddNewVersion`
   and `RoutinesController.Create`/`GetAll` must carry a valid JWT bearer token issued by
   `identity-service`, validated against the same HS256 shared secret, `aud`, and lifetime
   rules `identity-service` uses. An invalid/missing token is rejected (401) before any handler
   runs.
2. **No caller-asserted identity**: nothing in a request body or query string may claim to be
   "user X" anymore. `GetAll`'s `requestingUserId` query parameter (both controllers) and
   `CreateWorkoutCommand.OwnerId` / `AddWorkoutVersionCommand.OwnerId` /
   `CreateRoutineCommand.OwnerId` as client-settable fields all stop existing as bindable
   inputs. The acting user's id always comes from the validated token via
   `ICurrentUserAccessor`.
3. **`AddWorkoutVersionCommandHandler`'s existing ownership check becomes real enforcement**:
   `if (workout.OwnerId != request.OwnerId) return Result.Forbidden();` already exists — today
   it is cosmetic since `request.OwnerId` is caller-supplied and unvalidated (any caller can
   simply assert the matching value). Making `OwnerId` server-derived is what closes this gap;
   no handler code changes needed beyond the source of the value.
4. **Cache-invalidation fix**: after any successful Workout/Routine-changing event, the correct
   per-user cache entry (not the bare unscoped key) must be invalidated so `GetAll` reflects the
   change. Because MediatR events are published synchronously in-process, awaited, before
   `UnitOfWork.SaveChangesAsync` returns to the caller (confirmed by reading
   `Forma.Planner.Infrastructure/Data/UnitOfWork.cs`: `AfterSaveChangesAsync` — which publishes
   events — is awaited inside the same `SaveChangesAsync` call the command handler awaits), and
   because a Workout/Routine event's `OwnerId` is always the real acting user here (no
   shared-library null case, unlike `exercise-service`), fixing the event-handler's key alone is
   sufficient for the read-after-write guarantee. No command-handler-side cache call is needed
   (unlike `exercise-service`, where `OwnerId` can be null on the event).

### Explicitly missing / not this feature's job

- **`GetById`** for either Workout or Routine — doesn't exist today, not introduced here.
- **`exercise-service`'s own JWT wiring** — separate repo, separate implementation per ADR-007,
  already done there.
- **ADR-006 service-to-service endpoints** (`ExerciseReferencesController.IsReferenced`)
  remaining unauthenticated — explicitly flagged by ADR-007 as a known, deferred follow-up, not
  solved by this feature.
- **Fixing this repo's pre-existing, unrelated broken integration-test scaffold**
  (`tests/Forma.IntegrationTests/Controllers/V1/ExercisesControllerTests.cs` references
  `Forma.Application.Exercise.*`/`Forma.Domain.Entities.ExerciseAggregate.*` types that do not
  exist anywhere in this repo — leftover from the shared originating template, never adapted
  when `Workout`/`Routine` replaced `Exercise` as this service's own aggregates). This already
  fails to build before this feature's changes; not this feature's job to rewrite the whole
  suite. Flagged here so it isn't mistaken for something this change broke.

## Design (Service Architect)

### Authentication wiring (`Forma.Planner.PublicApi/Program.cs`)

- New `Auth` configuration section, `JwtOptions : IAppOptions`
  (`Forma.Planner.CoreInfrastructure/AppSettings/JwtOptions.cs`), `ConfigSectionPath => "Auth"`,
  one required property `JwtSigningKey`. Registered the same way `CacheOptions`/
  `ConnectionOptions` are — `Forma.Planner.CoreInfrastructure/ConfigureServices.cs`'s
  `ConfigureAppSettings()` gains `.AddOptionsWithValidation<JwtOptions>()`. Dev value
  (`sakjdhkjad872323`, matching `identity-service`'s real dev secret) lands in
  `appsettings.Development.json` under `"Auth": { "JwtSigningKey": "..." }` — plaintext,
  consistent with this repo's existing convention for `CacheOptions`/`ConnectionStrings` dev
  secrets (ADR-007 Consequences already calls this out as an accepted dev-only risk).
- `Program.cs`: `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options => ...)` reading `builder.Configuration.GetOptions<JwtOptions>()` for
  the signing key, plus `.AddAuthorization()`. `TokenValidationParameters` set exactly per
  ADR-007's table: `ValidateIssuerSigningKey = true` / symmetric key from `JwtSigningKey`;
  `ValidateIssuer = false`; `ValidateAudience = true` / `ValidAudience = "fastapi-users:auth"`;
  `ValidateLifetime = true`; `MapInboundClaims = false`. `app.UseAuthentication()` /
  `app.UseAuthorization()` already exist in the pipeline (currently inert, no scheme
  registered) — this feature is what makes them do real work.
- `.AddHttpContextAccessor()` is already registered in `Program.cs` — nothing to add there.

### `ICurrentUserAccessor`

- Interface in `Forma.Planner.CoreInfrastructure/Abstractions/ICurrentUserAccessor.cs` (same
  tier as `ICacheService`, so `Forma.Planner.Application`/`Forma.Planner.Query` handlers/
  controllers can depend on it without a new project reference): `Guid? UserId { get; }`
  (parsed from the raw `sub` claim, `null` if absent/unparsable — never coalesced to
  `Guid.Empty`), `bool IsAuthenticated { get; }`.
- Implementation `CurrentUserAccessor` in `Forma.Planner.PublicApi/Services/CurrentUserAccessor.cs`
  (not `Forma.Planner.Infrastructure`/`Forma.Planner.CoreInfrastructure` — those are plain
  `Microsoft.NET.Sdk` class libraries without a framework reference, so `IHttpContextAccessor`/
  `ClaimsPrincipal` aren't available there without adding one; `Forma.Planner.PublicApi` is
  `Microsoft.NET.Sdk.Web` and is the composition root). Registered
  `.AddHttpContextAccessor()` (already present) +
  `.AddScoped<ICurrentUserAccessor, CurrentUserAccessor>()` in `ServicesCollectionExtensions.cs`.
- Confirmed by inspection: no equivalent abstraction exists anywhere in this repo yet — this is
  a genuinely new type, not a duplicate of something already built for a prior feature.

### `WorkoutsController`

- `[Authorize]` added to `Create`, `GetAll`, `AddNewVersion` (all three — no anonymous path,
  per ADR-007 point 3/4).
- `GetAll` loses `[FromQuery][Required] Guid requestingUserId` entirely; reads
  `currentUserAccessor.UserId` (guaranteed non-null under `[Authorize]`) and passes it into
  `GetAllWorkoutQuery`.
- `Create`: after model binding, controller sets `command.OwnerId = currentUserAccessor.UserId!.Value`
  before calling `mediator.Send`.
- `AddNewVersion`: same treatment — controller sets `command.OwnerId` from
  `currentUserAccessor.UserId!.Value` post-binding, before `mediator.Send`. This is what turns
  `AddWorkoutVersionCommandHandler`'s existing `if (workout.OwnerId != request.OwnerId) return
  Result.Forbidden();` from cosmetic into real enforcement — no handler change needed.

### `RoutinesController`

- `[Authorize]` added to `Create`, `GetAll`.
- `GetAll` loses `requestingUserId`, reads `currentUserAccessor.UserId` instead.
- `Create`: controller sets `command.OwnerId` from `currentUserAccessor.UserId!.Value`
  post-binding.

### Commands

- `CreateWorkoutCommand.OwnerId`, `AddWorkoutVersionCommand.OwnerId`,
  `CreateRoutineCommand.OwnerId`: each gets `[JsonIgnore]` so it can no longer be set via the
  request body — the controller is the only place that assigns it, after model binding. The
  existing FluentValidation `NotEmpty()` rules on `OwnerId` stay as-is (defense in depth; the
  controller always sets a non-empty value under `[Authorize]`, but the validator still catches
  a programming error where it isn't set). Update each property's doc comment to say it's now
  server-derived, not caller-supplied (the old comments explicitly said "No auth exists yet" —
  now false).

### Cache-invalidation fix

- New static helpers `WorkoutCacheKeys.ForUser(Guid? userId)` and
  `RoutineCacheKeys.ForUser(Guid? userId)` in
  `Forma.Planner.CoreInfrastructure/Caching/WorkoutCacheKeys.cs` and `RoutineCacheKeys.cs` — the
  natural shared home since both `Forma.Planner.Application` (not currently used by the fix, but
  keeps the convention available) and `Forma.Planner.Query` already reference
  `Forma.Planner.CoreInfrastructure` (confirmed from both `.csproj` files — no new project
  reference introduced). `ForUser(Guid? userId) => $"{QueryName}:{userId}"`, `QueryName` a
  `private const string` literal (`"GetAllWorkoutQuery"` / `"GetAllRoutineQuery"`) rather than
  `nameof(GetAllWorkoutQuery)`/`nameof(GetAllRoutineQuery)` — those types live in
  `Forma.Planner.Query`, which `Forma.Planner.CoreInfrastructure` must not depend on (wrong
  dependency direction for a shared-kernel-tier project). The literals are guaranteed identical
  to today's `nameof`-produced strings, so no existing cache entries are orphaned by the change.
- `GetAllWorkoutQueryHandler`/`GetAllRoutineQueryHandler` build their cache key via
  `WorkoutCacheKeys.ForUser(request.RequestingUserId)` /
  `RoutineCacheKeys.ForUser(request.RequestingUserId)` instead of the inline interpolated
  string.
- `WorkoutEventHandler.ClearCacheAsync`/`RoutineEventHandler.ClearCacheAsync` (both take no
  parameters today, calling `cacheService.RemoveAsync(nameof(GetAllWorkoutQuery))` /
  `nameof(GetAllRoutineQuery)`) are changed to take the triggering event's `OwnerId` and call
  `WorkoutCacheKeys.ForUser(notification.OwnerId)` / `RoutineCacheKeys.ForUser(notification.OwnerId)`
  instead — this is the load-bearing fix (unlike `exercise-service`, no command-handler-side
  cache call is needed, since `notification.OwnerId` here is always the real acting user, never
  null).

### What's explicitly not built here

- `GetById` for Workout or Routine (doesn't exist yet, out of scope).
- Any curator/role system (not applicable here — no shared library exists for Workout/Routine).
- `exercise-service`'s own JWT wiring (separate repo, already done there).
- Closing the ADR-006 service-to-service unauthenticated-endpoint gap
  (`ExerciseReferencesController.IsReferenced`) — explicitly flagged by ADR-007 as a follow-up,
  not this feature's job.

## Review (Developer peer review + Service Architect conformance review)

### Conformance against Design

- `JwtOptions` added under `Forma.Planner.CoreInfrastructure/AppSettings`, wired through the
  existing `AddOptionsWithValidation<T>`/`IAppOptions` pattern — matches "Authentication
  wiring".
- `Program.cs` now calls `AddAuthentication().AddJwtBearer(...)` and `AddAuthorization()` with
  the exact `TokenValidationParameters` table from ADR-007; pre-existing
  `UseAuthentication()`/`UseAuthorization()` calls (previously inert) now do real work.
- `ICurrentUserAccessor` interface in `Forma.Planner.CoreInfrastructure/Abstractions`,
  implementation in `Forma.Planner.PublicApi/Services`, registered in
  `ServicesCollectionExtensions` — matches design, including the reasoning for why the
  implementation sits one layer further out than `ICacheService`'s.
- `WorkoutsController`: `[Authorize]` added to `Create`, `GetAll`, `AddNewVersion` (all three —
  no anonymous path, per the no-shared-library difference from `exercise-service`); `GetAll`'s
  `requestingUserId` parameter removed, replaced by `currentUserAccessor.UserId` read inside the
  action — matches design.
- `RoutinesController`: `[Authorize]` added to `Create`, `GetAll`; `GetAll`'s `requestingUserId`
  parameter removed the same way — matches design.
- `CreateWorkoutCommand.OwnerId`, `AddWorkoutVersionCommand.OwnerId`,
  `CreateRoutineCommand.OwnerId` all now `[JsonIgnore]`; controllers set each post-binding —
  matches design. No `Shared` flag added anywhere (correctly not applicable here).
- `WorkoutCacheKeys`/`RoutineCacheKeys` added to `Forma.Planner.CoreInfrastructure/Caching`,
  consumed by `GetAllWorkoutQueryHandler`/`GetAllRoutineQueryHandler` and by
  `WorkoutEventHandler.ClearCacheAsync`/`RoutineEventHandler.ClearCacheAsync` (passed
  `notification.OwnerId`) — matches "Cache-invalidation fix" exactly, including the
  literal-vs-`nameof` reasoning, and confirms no command-handler-side cache call was added
  (correctly not needed here, per the Requirements section's stated reasoning).

### Verified

- Re-verified every "already done" claim directly against the working tree before trusting it:
  `git status`/`git diff` scoped to `Forma.Planner/` confirmed Problem 1 (JWT auth wiring,
  `ICurrentUserAccessor`, `[Authorize]` + `[JsonIgnore]` on all three commands) was genuinely
  complete and building; direct reads of `GetAllWorkoutQueryHandler`/`GetAllRoutineQueryHandler`/
  `WorkoutEventHandler`/`RoutineEventHandler`/the `Caching/` folder showed Problem 2 (cache fix)
  had NOT actually been built yet, contrary to what an earlier pass of this doc's own Review
  section claimed. Completed it: added `RoutineCacheKeys.cs` (mirroring the already-present
  `WorkoutCacheKeys.cs`), pointed both `GetAll*QueryHandler`s at `*CacheKeys.ForUser(...)`, and
  changed `WorkoutEventHandler.ClearCacheAsync`/`RoutineEventHandler.ClearCacheAsync` to accept
  the triggering event's `OwnerId` and call `*CacheKeys.ForUser(ownerId)` instead of the bare
  unscoped key.
- Also found and fixed a related gap: `JwtOptions` has `[Required]` + `.ValidateOnStart()`
  (`ConfigureServices.cs`), so the app/test host throws at startup without an `Auth:JwtSigningKey`
  value. Neither `appsettings.Development.json` nor `appsettings.IntegrationTesting.json` had one
  yet. Added `"Auth": { "JwtSigningKey": "sakjdhkjad872323" }` (matching `identity-service`'s real
  dev secret, per ADR-007) to the former, and a distinct test-only value to the latter.
- Confirmed the "events fire synchronously in-process before `SaveChangesAsync` returns" premise
  by reading `Forma.Planner.Infrastructure/Data/UnitOfWork.cs` directly: `SaveChangesAsync` awaits
  `AfterSaveChangesAsync`, which awaits `Task.WhenAll(domainEvents.Select(mediator.Publish))` —
  confirmed, not just re-asserted.
- `dotnet build src/Forma.Planner.PublicApi/Forma.Planner.PublicApi.csproj` — run after each
  meaningful change (each new file, each handler/controller edit). Final state: 0 errors, 0 new
  warnings beyond the one pre-existing `ASPDEPR007` (unrelated, from `IncludeOpenAPIAnalyzers`,
  present before this feature too).
- `dotnet build tests/Forma.ArchitectureTests/Forma.ArchitectureTests.csproj` /
  `dotnet test` — builds and passes trivially (its one test scans `src/*.cs` text for
  `ExerciseResource.Create` call sites via Roslyn syntax parsing, not compiled references; there
  is no such type anywhere in this repo's `src/`, so it passes vacuously — unaffected by this
  feature either way).
- `dotnet build tests/Forma.IntegrationTests/Forma.IntegrationTests.csproj` — **fails, but this
  is a pre-existing condition confirmed present before any change in this feature**:
  `ExercisesControllerTests.cs`/`AssertExtensions.cs` reference `Forma.Application.Exercise.*`
  and `Forma.Domain.Entities.ExerciseAggregate.*`, namespaces that do not exist anywhere in this
  repo (leftover from the shared originating template — this service's actual aggregates are
  `Workout`/`Routine`, and no test file was ever written/adapted for them). Verified by running
  `dotnet build` on that project against the pre-feature `git stash`ed tree first — identical
  5 errors, same lines, before any of this feature's edits existed. Docker itself is available
  in this environment (confirmed: `mssql`, `mongo`, `redis` containers already running), so the
  *tooling* to run `Forma.IntegrationTests` (Testcontainers-based) is present — the test
  *project* simply does not compile, independent of this feature. Not fixed here (out of
  scope — rewriting/adapting the whole stale test suite to this service's actual domain is a
  separate, much larger task than ADR-007/this feature asks for); flagged explicitly rather than
  silently skipped, per instructions.
- Grepped for every changed signature's call sites (`GetAllWorkoutQuery`/`GetAllRoutineQuery`
  construction, `CreateWorkoutCommand.OwnerId`/`AddWorkoutVersionCommand.OwnerId`/
  `CreateRoutineCommand.OwnerId` usages, both controllers' `GetAll` routes,
  `WorkoutEventHandler`/`RoutineEventHandler` `ClearCacheAsync` call sites) — no stale caller
  found outside what was already updated.

### Findings

None blocking. One deviation from a literal reading of the design, discovered while
implementing (not a design error, just a naming correction applied consistently with
`exercise-service`'s own precedent):

1. `WorkoutCacheKeys`/`RoutineCacheKeys`'s `QueryName` constants are hardcoded string literals,
   not `nameof(GetAllWorkoutQuery)`/`nameof(GetAllRoutineQuery)`, for the dependency-direction
   reason stated in the Design section. The produced strings are identical to today's
   `nameof`-produced ones, so this has no behavioral effect on already-cached entries.

No test-fixture updates were needed to keep an existing green suite green, unlike
`exercise-service`'s FT-004 — because `Forma.IntegrationTests` here was already red before this
feature, for unrelated reasons (see "Verified" above), there was no green baseline to protect.
This is called out explicitly as a real limitation of this review: the auth wiring, the
`[Authorize]` gating, and the cache-key fix are verified by build + manual code inspection +
call-site grep only, not by an executed integration test, because none currently compiles in
this repo. Whoever picks up the stale test-suite cleanup should prioritize adding real
authenticated-request coverage for `WorkoutsController`/`RoutinesController` once the scaffold
is fixed — this feature's own correctness would benefit from it, it just isn't newly at fault
for the suite's current state.

## Central Architect Gate

*(`Forma.Claude`'s system-wide Architect — cross-service impact only, not a second local
design/code-quality pass.)*

### Cross-service impact assessment

- Implements ADR-007 exactly as specified for `training-planning-service`'s half of that
  decision — no local deviation that changes the cross-service contract (still HS256, same
  secret config-key intent, same claims). `exercise-service`'s independent implementation of the
  same ADR is out of scope here and was already done separately.
- No new domain concept, no new inter-service API/contract. `ICurrentUserAccessor`,
  `WorkoutCacheKeys`, `RoutineCacheKeys` are all internal-to-`training-planning-service`
  abstractions.
- Follow-up already flagged centrally by ADR-007 itself (ADR-006 service-to-service endpoints
  remaining unauthenticated — `ExerciseReferencesController.IsReferenced` in this repo) is not
  re-litigated here — it's the same tracked gap, not a new one introduced by this feature.

**Verdict: no promotion to `Forma.Claude`'s central ADRs needed.** This feature implements an
already-accepted ADR verbatim; nothing decided here needs to flow back upstream beyond the "now
built" status update for `training-planning-service`'s half.

### Central knowledge updated

- ADR-007's own "Consequences" section already anticipated both services implementing this
  independently; `training-planning-service`'s half is now built. No other central doc changes
  required.
