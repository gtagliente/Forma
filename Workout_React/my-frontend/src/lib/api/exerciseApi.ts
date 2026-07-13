import type { Exercise, MuscleGroup } from '../../types';
import { EXERCISE_API_BASE_URL } from './config';
import { authFetch } from './authFetch';

// The only module that knows exercise-service's actual endpoint/error
// shapes. Callers (ExerciseLibrary) get a typed ExerciseApiError to branch
// on instead of raw Response/ApiResponse shapes, mirroring authApi.ts.

export class ExerciseApiError extends Error {
  status: number;
  messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? 'Something went wrong.');
    this.name = 'ExerciseApiError';
    this.status = status;
    this.messages = messages;
  }
}

// Wire shape of exercise-service's ApiResponse (errors[].message list) on
// non-2xx responses. Body may be absent/unparseable (e.g. a raw 500 with no
// JSON) - falls back to a single generic message either way.
async function throwApiError(response: Response): Promise<never> {
  const data = (await response.json().catch(() => null)) as
    | { errors?: { message?: string | null }[] | null }
    | null;

  const messages = (data?.errors ?? [])
    .map((e) => e.message)
    .filter((m): m is string => Boolean(m));

  throw new ExerciseApiError(response.status, messages.length > 0 ? messages : ['Something went wrong.']);
}

interface ExerciseQueryModel {
  id: string;
  name: string | null;
  description: string | null;
  muscleGroups: MuscleGroup[] | null;
  ownerId: string | null;
}

function mapExercise(model: ExerciseQueryModel): Exercise {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    muscleGroups: model.muscleGroups,
    ownerId: model.ownerId,
  };
}

// GET /api/exercises/getall — result is nullable per
// ApiResponseOfIEnumerableOfExerciseQueryModel -> default to [].
// requestingUserId query param intentionally omitted: its filtering
// semantics aren't documented on the contract (see FT-002 design).
export async function listExercises(): Promise<Exercise[]> {
  const response = await authFetch(`${EXERCISE_API_BASE_URL}/api/exercises/getall`);

  if (!response.ok) {
    await throwApiError(response);
  }

  const data = (await response.json()) as { result: ExerciseQueryModel[] | null };
  return (data.result ?? []).map(mapExercise);
}

// POST /api/exercises/create. ownerId/parentId intentionally omitted from
// the body - optional/nullable on the contract, and picking a default
// (private vs. shared) is a business decision this client doesn't make
// (see FT-002 design flagging note).
export async function createExercise(input: {
  name: string;
  description: string;
  muscleGroups: MuscleGroup[];
}): Promise<{ id: string }> {
  const response = await authFetch(`${EXERCISE_API_BASE_URL}/api/exercises/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data = (await response.json()) as { result: { id: string } };
  return data.result;
}

// PUT /api/exercises/update. Gotcha: UpdateExerciseCommand.exerciseId is a
// wrapped ExerciseId value object ({ value: "<uuid>" }), NOT a bare string
// like CreateExerciseCommand.ownerId - only the JSON body wraps it, the
// path param on GET/DELETE {id} stays a plain string.
export async function updateExercise(input: {
  exerciseId: string;
  name?: string;
  description?: string;
  muscleGroups?: MuscleGroup[];
}): Promise<void> {
  const response = await authFetch(`${EXERCISE_API_BASE_URL}/api/exercises/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exerciseId: { value: input.exerciseId },
      name: input.name,
      description: input.description,
      muscleGroups: input.muscleGroups,
    }),
  });

  if (!response.ok) {
    await throwApiError(response);
  }
}

// DELETE /api/exercises/{id}. Plain string id in the URL - path param, not
// the body, so the ExerciseId-wrapping gotcha above doesn't apply here.
export async function deleteExercise(id: string): Promise<void> {
  const response = await authFetch(`${EXERCISE_API_BASE_URL}/api/exercises/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    await throwApiError(response);
  }
}
