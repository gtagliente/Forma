

// The entry inside Workout.exercises - mirrors WorkoutExerciseEntryDto /
// WorkoutExerciseEntryQueryModel exactly (structurally identical on the
// wire per FT-003 design, so one type covers both create/addnewversion
// request payloads and the getall response - no exercise name here, only
// exerciseId; display always needs a separate exercise-service lookup).
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

// Mirrors WorkoutQueryModel (training-planning-service) field-for-field
// (FT-003). Was previously `{id, title, exercises: WorkoutExercise[]}` -
// a Workout Session's actual-execution shape, not a planned Workout
// template; replaced structurally, not just renamed.
export interface Workout {
  id: string;
  ownerId: string;
  name: string;
  currentVersionNumber: number;
  exercises: WorkoutExerciseEntry[];
}


export interface ExerciseSet {
  id: string;
  // setNumber: number;
  reps: number;
  durationSeconds: number;
  pauseSeconds: number;
}

// ExerciseItem.tsx's read-only display shape (sets/reps/duration/pause).
// No longer fed directly by training-planning-service data (FT-003 made
// Workout.exercises a WorkoutExerciseEntry[] instead) - WorkoutDetail
// projects each WorkoutExerciseEntry into this shape for display. Per the
// FT-003 Analyst's finding, this is actually shaped like a Workout
// Session's actual-execution log, the concept CLAUDE.md keeps deliberately
// distinct from a planned Workout template - reserved for a future Workout
// Session feature, not repurposed as the Workout-composition type.
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'FullBody';

// The real exercise-service entity, mirrors ExerciseQueryModel exactly
// (including its nullability) rather than inventing display defaults here.
export interface Exercise {
  id: string;
  name: string | null;
  description: string | null;
  muscleGroups: MuscleGroup[] | null;
  ownerId: string | null;
}


// Mirrors RoutineEntryQueryModel / RoutineEntryDto (training-planning-service)
// field-for-field (FT-004). Same conceptual field, two different wire
// `workoutId` shapes depending on direction (bare uuid on list, {value: uuid}
// on create) - the wrap is normalized away entirely inside routineApi.ts, so
// this type (and every component) only ever sees a bare uuid string.
export interface RoutineEntry {
  workoutId: string;
  dayOfWeek: number | null;
  sequence: number;
}

// Mirrors RoutineQueryModel field-for-field (FT-004). Was previously
// `{id, name, workouts: Workout[]}` with full embedded Workout objects - the
// real contract only returns entries[] (a workoutId reference plus
// scheduling metadata), nothing duplicated from Workout. Resolving an
// entry's workoutId to full Workout data is a client-side join components
// perform themselves (see RoutineList.tsx / RoutineDetail.tsx).
export interface Routine {
  id: string;
  ownerId: string;
  name: string;
  entries: RoutineEntry[];
}

export interface User {
  id: string;
  email: string;
}