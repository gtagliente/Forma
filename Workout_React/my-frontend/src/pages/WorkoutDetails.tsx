import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Exercise, ExerciseSet, Workout, WorkoutExercise } from '../types';
import { ExerciseItem } from '../components/Exercise/ExerciseItem'; // Assicurati che il path sia giusto
import WorkoutForm from '../components/Workout/WorkoutForm';
import { useAuth } from '../context/AuthContext';
import { listExercises } from '../lib/api/exerciseApi';
import { ArrowLeft, Pencil } from 'lucide-react';

// FT-003: reads from the `workouts` array lifted in App.tsx instead of
// traversing a `routines` prop - there's no get-by-id endpoint on
// training-planning-service, so the already-fetched list is this page's
// only legitimate data source. refreshWorkouts is the same callback passed
// to WorkoutsPage, needed here too since the Edit button opens the same
// WorkoutForm.
export const WorkoutDetail = ({
  workouts,
  refreshWorkouts,
}: {
  workouts: Workout[];
  refreshWorkouts: () => Promise<void>;
}) => {
  const { id } = useParams();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Own fetch of the FT-002 exercise list: WorkoutDetail can be reached
  // directly (its own route), not only via WorkoutsPage, and there's no
  // shared Context for exerciseNames (design explicitly rejects adding
  // one) - each page that needs the lookup/picker fetches it itself.
  useEffect(() => {
    const load = async () => {
      try {
        const result = await listExercises();
        setExercises(result);
      } catch {
        // Exercise-name lookup is a display nicety - a failed fetch just
        // leaves raw ids showing in place of names below.
      }
    };
    void load();
  }, []);

  const exerciseNames = useMemo(
    () => Object.fromEntries(exercises.map((ex) => [ex.id, ex.name ?? ex.id])),
    [exercises],
  );

  const workout = workouts.find(w => w.id === id);

  if (!workout) {
    return <div className="text-white p-8">Workout non trovato</div>;
  }

  // Projects each real WorkoutExerciseEntry into ExerciseItem's existing
  // {id, name, sets: ExerciseSet[]} prop shape for read-only display -
  // "4 sets of 8 reps" and 4 identical set-rows are the same fact shown two
  // ways (per the FT-003 design). ExerciseItem's own Add/Remove-set
  // buttons and per-row inputs have no backend target once fed this data
  // (addnewversion resubmits the whole exercises list, never one set in
  // isolation) - same already-accepted inert-affordance pattern as
  // WorkoutCard's decorative Pencil icon before this feature.
  const displayExercises: WorkoutExercise[] = workout.exercises.map((entry) => ({
    id: entry.exerciseId,
    name: exerciseNames[entry.exerciseId] ?? entry.exerciseId,
    sets: Array.from({ length: entry.sets }, (_, i): ExerciseSet => ({
      id: `${entry.exerciseId}-${i}`,
      reps: entry.reps ?? 0,
      durationSeconds: entry.durationSeconds ?? 0,
      pauseSeconds: entry.restSeconds ?? 0,
    })),
  }));

  return (
    <div className="p-4 max-w-screen-xl  min-h-screen bg-gray-950 text-white">
      {/* Bottone Indietro + Edit - a Workout is no longer necessarily
          reached through a Routine, so the back-link targets /workouts
          unconditionally instead of a derived routineId. */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/workouts" className="flex items-center text-gray-400 text-sm">
          <ArrowLeft size={16} className="mr-1" /> Torna ai workout
        </Link>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-950 bg-blue-400 hover:bg-blue-300 transition-colors rounded-lg px-3 py-2"
        >
          <Pencil size={14} /> Modifica
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">{workout.name}</h1>

      {/* Lista degli esercizi (Accordion) */}
      <div className="grid gap-2">
        {displayExercises.map(ex => (
          <ExerciseItem key={ex.id} exercise={ex} />
        ))}
      </div>

      {isFormOpen && (
        <WorkoutForm
          ownerId={user!.id}
          exercises={exercises}
          initialWorkout={workout}
          onClose={() => setIsFormOpen(false)}
          onSaved={refreshWorkouts}
        />
      )}
    </div>
  );
};
