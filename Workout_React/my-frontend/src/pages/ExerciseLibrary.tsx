import { useEffect, useMemo, useState } from 'react';
import type { Exercise, MuscleGroup } from '../types';
import { listExercises, createExercise, updateExercise, deleteExercise, ExerciseApiError } from '../lib/api/exerciseApi';
import { ExerciseLibraryItem } from '../components/Exercise/ExerciseLibraryItem';
import ExerciseForm from '../components/Exercise/ExerciseForm';
import { Dumbbell, Plus, X } from 'lucide-react';

const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'FullBody'];

// New container/page (per FT-002 design): neither ExerciseItem nor
// ExerciseForm was previously reachable as an "Exercise library" screen.
// Search/muscle-group filters are local useMemo derivations over the
// already-fetched array - no server-side search/filter capability exists
// on exercise-service's contract.
export const ExerciseLibrary = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[] | null>(null);

  const [search, setSearch] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<MuscleGroup[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);

  const loadExercises = async () => {
    try {
      const result = await listExercises();
      setExercises(result);
    } catch (err) {
      setErrors(err instanceof ExerciseApiError ? err.messages : ['Something went wrong.']);
    } finally {
      setIsLoading(false);
    }
  };

  // Mirrors AuthContext.tsx's hydrate pattern: the initial-mount fetch is
  // its own function declared inside the effect (rather than the effect
  // calling the outer, handler-shared `loadExercises` directly), which is
  // what satisfies react-hooks/set-state-in-effect here.
  useEffect(() => {
    const load = async () => {
      await loadExercises();
    };
    void load();
  }, []);

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesName = query === '' || (exercise.name ?? '').toLowerCase().includes(query);
      const matchesGroups =
        selectedGroups.length === 0 ||
        (exercise.muscleGroups ?? []).some((group) => selectedGroups.includes(group));
      return matchesName && matchesGroups;
    });
  }, [exercises, search, selectedGroups]);

  const toggleGroupFilter = (group: MuscleGroup) => {
    setSelectedGroups((current) =>
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
    );
  };

  const openCreateForm = () => {
    setEditingExercise(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExercise(undefined);
  };

  const handleSave = async (input: { name: string; description: string; muscleGroups: MuscleGroup[] }) => {
    setErrors(null);
    try {
      if (editingExercise) {
        await updateExercise({
          exerciseId: editingExercise.id,
          name: input.name,
          description: input.description,
          muscleGroups: input.muscleGroups,
        });
      } else {
        await createExercise(input);
      }
      closeForm();
      await loadExercises();
    } catch (err) {
      setErrors(err instanceof ExerciseApiError ? err.messages : ['Something went wrong.']);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questo esercizio?')) {
      return;
    }
    setErrors(null);
    try {
      await deleteExercise(id);
      await loadExercises();
    } catch (err) {
      setErrors(err instanceof ExerciseApiError ? err.messages : ['Something went wrong.']);
    }
  };

  return (
    <div className="p-4 max-w-screen-xl min-h-screen bg-gray-950 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-xl flex items-center gap-2">
          <Dumbbell size={20} /> Libreria Esercizi
        </h1>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-950 bg-blue-400 hover:bg-blue-300 transition-colors rounded-lg px-3 py-2"
        >
          <Plus size={14} /> Nuovo Esercizio
        </button>
      </div>

      {errors && (
        <div className="mb-4 flex items-start justify-between gap-2 bg-gray-900 border border-red-900/50 rounded-lg p-3">
          <div>
            {errors.map((message, idx) => (
              <p key={idx} className="text-red-400 text-sm">{message}</p>
            ))}
          </div>
          <button onClick={() => setErrors(null)} className="text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {isFormOpen && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-300">
              {editingExercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
            </h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-white text-xs uppercase font-bold">
              Annulla
            </button>
          </div>
          <ExerciseForm
            key={editingExercise?.id ?? 'new'}
            initialValue={editingExercise}
            onSave={(input) => { void handleSave(input); }}
          />
        </div>
      )}

      <div className="mb-4 grid gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome..."
          className="w-full rounded-lg border border-gray-600 bg-gray-900 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />

        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              onClick={() => toggleGroupFilter(group)}
              className={`text-[10px] uppercase font-bold rounded-full px-3 py-1.5 border transition-colors ${
                selectedGroups.includes(group)
                  ? 'bg-blue-400 text-gray-950 border-blue-400'
                  : 'bg-gray-900 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Caricamento...</p>
      ) : filteredExercises.length === 0 ? (
        <p className="text-gray-400 text-sm">Nessun esercizio trovato.</p>
      ) : (
        <div className="grid gap-2">
          {filteredExercises.map((exercise) => (
            <ExerciseLibraryItem
              key={exercise.id}
              exercise={exercise}
              onEdit={openEditForm}
              onDelete={(id) => { void handleDelete(id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
