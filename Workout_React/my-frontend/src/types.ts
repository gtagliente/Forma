

export interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
}


export interface ExerciseSet {
  id: string;
  // setNumber: number;
  reps: number;
  durationSeconds: number;
  pauseSeconds: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}


export interface Routine {
  id: string;
  name: string;
  workouts: Workout[];
}