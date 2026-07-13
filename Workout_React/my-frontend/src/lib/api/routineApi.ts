import type { Routine, RoutineEntry } from '../../types';
import { PLANNING_API_BASE_URL } from './config';
import { authFetch } from './authFetch';

// The only module that knows training-planning-service's Routines
// endpoint/error shapes. Callers get a typed RoutineApiError to branch on
// instead of raw Response/ApiResponse shapes, mirroring authApi.ts /
// workoutApi.ts.

export class RoutineApiError extends Error {}

// Wire shape of training-planning-service's ApiResponse (errors[].message
// list) - same shape/parsing as workoutApi.ts's readErrorMessage, kept as
// its own local copy rather than a shared helper, per this repo's existing
// per-service-module convention (each API module owns its own error
// parsing - see authApi.ts / workoutApi.ts).
async function readErrorMessage(response: Response): Promise<string> {
  const data = (await response.json().catch(() => null)) as
    | { errors?: { message?: string | null }[] | null }
    | null;

  return data?.errors?.[0]?.message ?? `Request failed with status ${response.status}.`;
}

// Wire shape of a single item in RoutineQueryModel.entries - workoutId is
// already a bare uuid string here (list direction). Structurally identical
// to types.ts's RoutineEntry, so no field-by-field mapping is needed beyond
// the null -> [] defaults on the parent RoutineQueryModel.
interface RoutineQueryModel {
  id: string;
  ownerId: string;
  name: string | null;
  entries: RoutineEntry[] | null;
}

// POST /api/routines/create. RoutineEntryDto.workoutId is a wrapped
// WorkoutId ({value: uuid}), not a bare uuid string - the identical
// {value: uuid} trap workoutApi.ts's addWorkoutVersion hits for
// AddWorkoutVersionCommand.workoutId. Same normalization approach: the wrap
// is constructed only here, at the request-serialization boundary. Every
// caller (Routine.entries[].workoutId, the workoutsById lookup map,
// CreateRoutineForm's draft state) only ever sees/produces a bare uuid
// string - the wrapped shape never leaks into types.ts or components.
// 201 -> result.id. 400/500 both reference the ApiResponse schema, so
// errors[0]?.message is safe to read for either.
export async function createRoutine(
  ownerId: string,
  name: string,
  entries: RoutineEntry[],
): Promise<string> {
  const response = await authFetch(`${PLANNING_API_BASE_URL}/api/routines/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerId,
      name,
      entries: entries.map((entry) => ({
        workoutId: { value: entry.workoutId },
        dayOfWeek: entry.dayOfWeek,
        sequence: entry.sequence,
      })),
    }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new RoutineApiError(message);
  }

  const data = (await response.json()) as { result: { id: string } };
  return data.result.id;
}

// GET /api/routines/getall?requestingUserId=... - result is nullable per
// ApiResponseOfIEnumerableOfRoutineQueryModel -> default to []. Field names
// already match Routine 1:1 (FT-004 shape) - entries[].workoutId is a bare
// uuid string on this direction, no unwrap needed.
export async function getAllRoutines(requestingUserId: string): Promise<Routine[]> {
  const url = new URL(`${PLANNING_API_BASE_URL}/api/routines/getall`);
  url.searchParams.set('requestingUserId', requestingUserId);

  const response = await authFetch(url.toString());

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new RoutineApiError(message);
  }

  const data = (await response.json()) as { result: RoutineQueryModel[] | null };
  return (data.result ?? []).map((model) => ({
    id: model.id,
    ownerId: model.ownerId,
    name: model.name ?? '',
    entries: model.entries ?? [],
  }));
}
