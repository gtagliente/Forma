import { useEffect, useMemo, useState } from 'react';
import type { Exercise, Workout } from '../types';
import { useAuth } from '../context/AuthContext';
import { listExercises } from '../lib/api/exerciseApi';
import WorkoutList from '../components/Workout/WorkoutList';
import WorkoutForm from '../components/Workout/WorkoutForm';
import { Dumbbell, Plus } from 'lucide-react';

// New standalone route (FT-003 design): GET /api/workouts/getall returns
// all of the caller's Workouts independent of any Routine, but the only
// existing WorkoutCard call site was Routine-nested (RoutineDetail) - this
// is the Routine-independent "all my workouts" screen the design calls
// for. workouts/refreshWorkouts are lifted state from App.tsx (mirrors how
// routines is already handled), fetched once there and passed down here.
export const WorkoutsPage = ({
  workouts,
  refreshWorkouts,
}: {
  workouts: Workout[];
  refreshWorkouts: () => Promise<void>;
}) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);

  // Mirrors ExerciseLibrary.tsx's hydrate pattern: the initial-mount fetch
  // is its own function declared inside the effect, satisfying
  // react-hooks/set-state-in-effect. FT-002's own listExercises() is reused
  // here (not a parallel fetch function) purely as the exerciseId->name
  // lookup source and as the picker's option list for WorkoutForm.
  useEffect(() => {
    const load = async () => {
      try {
        const result = await listExercises();
        setExercises(result);
      } catch {
        // Exercise-name lookup/picker is a display nicety here - a failed
        // fetch just leaves the picker empty and raw ids showing in place
        // of names below.
      }
    };
    void load();
  }, []);

  const exerciseNames = useMemo(
    () => Object.fromEntries(exercises.map((ex) => [ex.id, ex.name ?? ex.id])),
    [exercises],
  );

  // No backend search param exists on getall (confirmed by the contract) -
  // client-side substring filter over the already-fetched array, same
  // approach as ExerciseLibrary's own search for consistency.
  const filteredWorkouts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query === '' ? workouts : workouts.filter((w) => w.name.toLowerCase().includes(query));
  }, [workouts, search]);

  const openCreateForm = () => {
    setEditingWorkout(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (workout: Workout) => {
    setEditingWorkout(workout);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingWorkout(undefined);
  };

  return (
    <div className="p-4 max-w-screen-xl min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <Dumbbell size={20} /> I tuoi Workout
        </h1>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-950 bg-blue-400 hover:bg-blue-300 transition-colors rounded-lg px-3 py-2"
        >
          <Plus size={14} /> Nuovo Workout
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cerca per nome..."
        className="w-full mb-4 rounded-lg border border-gray-600 bg-gray-900 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
      />

      {filteredWorkouts.length === 0 ? (
        <p className="text-gray-400 text-sm">Nessun workout trovato.</p>
      ) : (
        <WorkoutList workouts={filteredWorkouts} exerciseNames={exerciseNames} onEdit={openEditForm} />
      )}

      {isFormOpen && (
        <WorkoutForm
          ownerId={user!.id}
          exercises={exercises}
          initialWorkout={editingWorkout}
          onClose={closeForm}
          onSaved={refreshWorkouts}
        />
      )}
    </div>
  );
};
