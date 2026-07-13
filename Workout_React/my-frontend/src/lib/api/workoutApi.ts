import type { Workout, WorkoutExerciseEntry } from '../../types';
import { PLANNING_API_BASE_URL } from './config';
import { authFetch } from './authFetch';

// The only module that knows training-planning-service's actual Workouts
// endpoint/error shapes. Callers get a typed WorkoutApiError to branch on
// instead of raw Response/ApiResponse shapes, mirroring authApi.ts /
// exerciseApi.ts.

export type WorkoutErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'UNKNOWN_ERROR';

export class WorkoutApiError extends Error {
  code: WorkoutErrorCode;

  constructor(code: WorkoutErrorCode, message: string) {
    super(message);
    this.name = 'WorkoutApiError';
    this.code = code;
  }
}

// Wire shape of training-planning-service's ApiResponse (errors[].message
// list) - safe to read on every non-2xx response here EXCEPT
// addnewversion's 403, which has no schema at all (see addWorkoutVersion).
async function readErrorMessage(response: Response): Promise<string> {
  const data = (await response.json().catch(() => null)) as
    | { errors?: { message?: string | null }[] | null }
    | null;

  return data?.errors?.[0]?.message ?? `Request failed with status ${response.status}.`;
}

// Wire shape of a single item in WorkoutQueryModel.exercises - structurally
// identical to WorkoutExerciseEntry (WorkoutExerciseEntryQueryModel /
// WorkoutExerciseEntryDto are the same shape on the wire per the design),
// so no field-by-field mapping is needed beyond the null -> [] default.
interface WorkoutQueryModel {
  id: string;
  ownerId: string;
  name: string | null;
  currentVersionNumber: number;
  exercises: WorkoutExerciseEntry[] | null;
}

// POST /api/workouts/create. 201 -> result.id. 400/500 both reference the
// ApiResponse schema, so errors[0]?.message is safe to read for either.
export async function createWorkout(
  ownerId: string,
  name: string,
  exercises: WorkoutExerciseEntry[],
): Promise<{ id: string }> {
  const response = await authFetch(`${PLANNING_API_BASE_URL}/api/workouts/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId, name, exercises }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new WorkoutApiError(response.status === 400 ? 'VALIDATION_ERROR' : 'UNKNOWN_ERROR', message);
  }

  const data = (await response.json()) as { result: { id: string } };
  return data.result;
}

// GET /api/workouts/getall?requestingUserId=... - result is nullable per
// ApiResponseOfIEnumerableOfWorkoutQueryModel -> default to []. Field names
// already match Workout 1:1 (types.ts's FT-003 shape) - no reshaping beyond
// the null defaults.
export async function listWorkouts(requestingUserId: string): Promise<Workout[]> {
  const url = new URL(`${PLANNING_API_BASE_URL}/api/workouts/getall`);
  url.searchParams.set('requestingUserId', requestingUserId);

  const response = await authFetch(url.toString());

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new WorkoutApiError(response.status === 400 ? 'VALIDATION_ERROR' : 'UNKNOWN_ERROR', message);
  }

  const data = (await response.json()) as { result: WorkoutQueryModel[] | null };
  return (data.result ?? []).map((model) => ({
    id: model.id,
    ownerId: model.ownerId,
    name: model.name ?? '',
    currentVersionNumber: model.currentVersionNumber,
    exercises: model.exercises ?? [],
  }));
}

// POST /api/workouts/addnewversion. This is the *only* place
// AddWorkoutVersionCommand's wrapped WorkoutId ({value: uuid}) gets
// constructed - every caller only ever sees/produces a bare uuid string,
// mirroring exerciseApi.ts's updateExercise gotcha comment for the same
// kind of shape trap. 200 -> resolves with no data (the contract returns a
// bare ApiResponse) - callers must re-fetch listWorkouts() to observe the
// bumped currentVersionNumber.
export async function addWorkoutVersion(
  workoutId: string,
  ownerId: string,
  exercises: WorkoutExerciseEntry[],
): Promise<void> {
  const response = await authFetch(`${PLANNING_API_BASE_URL}/api/workouts/addnewversion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workoutId: { value: workoutId }, ownerId, exercises }),
  });

  if (response.ok) {
    return;
  }

  // 403's body has no schema in the contract (content: {"application/json": {}},
  // unlike 400/404/500 which all reference ApiResponse) - branch on the
  // status code alone, don't attempt to parse a message out of it.
  if (response.status === 403) {
    throw new WorkoutApiError('FORBIDDEN', "You don't own this workout.");
  }

  const message = await readErrorMessage(response);
  if (response.status === 404) {
    throw new WorkoutApiError('NOT_FOUND', message);
  }
  if (response.status === 400) {
    throw new WorkoutApiError('VALIDATION_ERROR', message);
  }
  throw new WorkoutApiError('UNKNOWN_ERROR', message);
}
