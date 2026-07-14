import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Exercise, Routine, Workout } from '../types';
import { WorkoutCard } from '../components/Workout/WorkoutCard';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllRoutines } from '../lib/api/routineApi';
import { listWorkouts } from '../lib/api/workoutApi';
import { listExercises } from '../lib/api/exerciseApi';

// FT-004: no per-id GET exists for a Routine (confirmed against the
// contract) - this page still resolves via .find() against the full
// getall list, same pattern as before, only the list now comes from a real
// fetch instead of a `routines` prop threaded from App.tsx. It also
// self-fetches FT-003's workout list to resolve entries[].workoutId into
// full Workout data, since RoutineQueryModel carries no embedded Workout.
// Deliberately its own fetch, not shared with RoutineList's identical one -
// no cache/context layer per the design (two-page app, modest data volume).
export const RoutineDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [routinesResult, workoutsResult] = await Promise.all([
          getAllRoutines(user.id),
          listWorkouts(user.id),
        ]);
        setRoutines(routinesResult);
        setWorkouts(workoutsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
    // Keyed on user.id, not the user object - see RoutineList.tsx for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    
  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts]);

  const routine = routines.find(r => r.id === id);

  // Sorted by sequence ascending, resolved through workoutsById, misses
  // filtered out defensively (no delete endpoint exists yet, but nothing
  // guarantees referential integrity client-side).
  const resolvedWorkouts = useMemo(() => {
    if (!routine) return [];
    return [...routine.entries]
      .sort((a, b) => a.sequence - b.sequence)
      .map((entry) => workoutsById.get(entry.workoutId))
      .filter((w): w is Workout => w !== undefined);
  }, [routine, workoutsById]);

  if (isLoading) {
    return <div className="text-white p-8">Caricamento...</div>;
  }

  if (error) {
    return <div className="text-red-400 p-8">{error}</div>;
  }

  if (!routine) {
    return <div className="text-white p-8">Routine non trovata</div>;
  }

  
  return (
    <div className="p-4 max-w-screen-xl min-h-screen">
      {/* Header con tasto Indietro */}
      <div className="mb-6">
        <Link to="/" className="flex items-center text-gray-400 hover:text-white text-sm mb-4">
          <ArrowLeft size={16} className="mr-1" /> Torna alle schede
        </Link>
        <h1 className="text-2xl font-bold text-white">{routine.name}</h1>
        <p className="text-gray-500 text-xs mt-1">
          {routine.entries.length} Allenamenti pianificati
        </p>
      </div>

      {/* Lista dei Workout appartenenti a questa routine */}
      <div className="grid gap-3">
        {resolvedWorkouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} exerciseNames={exerciseNames} />
          
          // <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </div>
  );
};
