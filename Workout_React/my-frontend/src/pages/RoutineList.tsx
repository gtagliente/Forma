import { useEffect, useMemo, useState } from 'react';
import type { Routine, Workout } from '../types';
import { RoutineCard } from '../components/Routine/RoutineCard';
import { CreateRoutineForm } from '../components/Routine/CreateRoutineForm';
import { useAuth } from '../context/AuthContext';
import { getAllRoutines } from '../lib/api/routineApi';
import { listWorkouts } from '../lib/api/workoutApi';
import { Plus } from 'lucide-react';

// New page (FT-004 design), replacing App.tsx's inline `/` route JSX
// (mock initialRoutines + useState). Owns the authenticated dual fetch
// (getAllRoutines + FT-003's listWorkouts, needed to resolve
// entries[].workoutId into an exercise count) and builds a workoutsById
// map via useMemo - deliberately its own fetch, not shared with
// RoutineDetail's identical one (no cache/context layer per the design:
// a two-page app with modest data volume doesn't justify it yet). Also
// owns the client-side search (getall has no server-side search param,
// so filtering runs over the already-fetched list by routine.name) and
// the "+ Nuova scheda" create-form toggle.
export const RoutineList = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadAll = async () => {
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

  // Mirrors ExerciseLibrary.tsx's hydrate pattern: the initial-mount fetch
  // is its own function declared inside the effect, satisfying
  // react-hooks/set-state-in-effect, while `loadAll` stays reusable as the
  // post-create refetch (no created-routine detail comes back beyond `id`,
  // same refetch-after-write pattern FT-003 established for addnewversion).
  useEffect(() => {
    const load = async () => {
      await loadAll();
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts]);

  // Only free-text field on RoutineQueryModel is `name` - baseline
  // requirement from the Analyst, the "filter by referenced workout name"
  // extension isn't built (not requested).
  const filteredRoutines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === '' ? routines : routines.filter((r) => r.name.toLowerCase().includes(q));
  }, [routines, query]);

  const exerciseCountFor = (routine: Routine) =>
    routine.entries.reduce((sum, e) => sum + (workoutsById.get(e.workoutId)?.exercises.length ?? 0), 0);

  return (
    <div className="p-4 max-w-screen-xl min-h-screen bg-gray-950">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white font-bold text-xl">Le tue Schede</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-950 bg-blue-400 hover:bg-blue-300 transition-colors rounded-lg px-3 py-2"
        >
          <Plus size={14} /> Nuova scheda
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca per nome..."
        className="w-full mb-4 rounded-lg border border-gray-600 bg-gray-900 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
      />

      {isFormOpen && (
        <div className="mb-4">
          <CreateRoutineForm
            ownerId={user!.id}
            workouts={workouts}
            onClose={() => setIsFormOpen(false)}
            onCreated={loadAll}
          />
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Caricamento...</p>
      ) : filteredRoutines.length === 0 ? (
        <p className="text-gray-400 text-sm">Nessuna scheda trovata.</p>
      ) : (
        <div className="grid gap-3">
          {filteredRoutines.map((r) => (
            <RoutineCard key={r.id} routine={r} exerciseCount={exerciseCountFor(r)} />
          ))}
        </div>
      )}
    </div>
  );
};
