import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Exercise, Workout, WorkoutExerciseEntry } from '../../types';
import { createWorkout, addWorkoutVersion, WorkoutApiError } from '../../lib/api/workoutApi';
import { Plus, Minus, X } from 'lucide-react';

interface WorkoutFormRow {
  exerciseId: string;
  sets: string;
  reps: string;
  durationSeconds: string;
  weight: string;
  restSeconds: string;
}

function toRow(entry: WorkoutExerciseEntry): WorkoutFormRow {
  return {
    exerciseId: entry.exerciseId,
    sets: String(entry.sets),
    reps: entry.reps?.toString() ?? '',
    durationSeconds: entry.durationSeconds?.toString() ?? '',
    weight: entry.weight?.toString() ?? '',
    restSeconds: entry.restSeconds?.toString() ?? '',
  };
}

function emptyRow(defaultExerciseId: string): WorkoutFormRow {
  return { exerciseId: defaultExerciseId, sets: '', reps: '', durationSeconds: '', weight: '', restSeconds: '' };
}

// Shared create/new-version modal (FT-003 design): both actions submit the
// same shape (name + the full exercises list). AddWorkoutVersionCommand has
// no name field at all, so edit mode shows the current name read-only
// rather than as an editable input - flagged in the design so it isn't
// assumed renamable. Reuses ExerciseItem.tsx's overlay convention
// (bg-black/50 backdrop-blur, bg-gray-800 border-gray-700 rounded-xl
// shadow-2xl) adapted to a viewport-fixed modal, since this form is opened
// from several different containers (WorkoutCard's Pencil icon inside a
// grid, WorkoutDetail's header) rather than one card's own
// relatively-positioned box like "Recupero Generale" is.
export default function WorkoutForm({
  ownerId,
  exercises,
  initialWorkout,
  onClose,
  onSaved,
}: {
  ownerId: string;
  exercises: Exercise[];
  initialWorkout?: Workout;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isEditMode = Boolean(initialWorkout);

  const [name, setName] = useState(initialWorkout?.name ?? '');
  const [rows, setRows] = useState<WorkoutFormRow[]>(
    initialWorkout ? initialWorkout.exercises.map(toRow) : [],
  );
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLowerCase();
    if (query === '') return exercises;
    return exercises.filter((ex) => (ex.name ?? '').toLowerCase().includes(query));
  }, [exercises, exerciseSearch]);

  const exerciseName = (exerciseId: string) =>
    exercises.find((ex) => ex.id === exerciseId)?.name ?? exerciseId;

  const updateRow = (index: number, patch: Partial<WorkoutFormRow>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((current) => [...current, emptyRow(filteredExercises[0]?.id ?? exercises[0]?.id ?? '')]);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, i) => i !== index));
  };

  const canSubmit = !isSaving && rows.length > 0 && (isEditMode || name.trim() !== '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);

    const payloadExercises: WorkoutExerciseEntry[] = rows.map((row, index) => ({
      exerciseId: row.exerciseId,
      sets: Number(row.sets) || 0,
      reps: row.reps === '' ? undefined : Number(row.reps),
      durationSeconds: row.durationSeconds === '' ? undefined : Number(row.durationSeconds),
      weight: row.weight === '' ? undefined : Number(row.weight),
      restSeconds: row.restSeconds === '' ? undefined : Number(row.restSeconds),
      sequence: index,
    }));

    try {
      if (initialWorkout) {
        await addWorkoutVersion(initialWorkout.id, ownerId, payloadExercises);
      } else {
        await createWorkout(ownerId, name.trim(), payloadExercises);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof WorkoutApiError ? err.message : 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-800 border border-gray-700 rounded-xl p-6 z-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300">
            {isEditMode ? 'Nuova versione' : 'Nuovo Workout'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {isEditMode ? (
            <div>
              <label className="block text-[10px] text-gray-400 uppercase mb-1">Workout</label>
              <p className="text-white text-sm">{name}</p>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] text-gray-400 uppercase mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full bg-gray-950 border border-gray-600 p-2 rounded-lg text-white focus:border-blue-500 outline-none transition-all"
                placeholder="es. Giorno Spinta"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-gray-400 uppercase mb-1">Cerca esercizio</label>
            <input
              type="text"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="w-full bg-gray-950 border border-gray-600 p-2 rounded-lg text-white focus:border-blue-500 outline-none transition-all"
              placeholder="Filtra per nome..."
            />
          </div>

          <div className="grid gap-3">
            {rows.map((row, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 grid gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={row.exerciseId}
                    onChange={(e) => updateRow(index, { exerciseId: e.target.value })}
                    className="flex-1 bg-gray-950 border border-gray-600 p-2 rounded-lg text-white focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="" disabled>Seleziona esercizio</option>
                    {row.exerciseId && !filteredExercises.some((ex) => ex.id === row.exerciseId) && (
                      <option value={row.exerciseId}>{exerciseName(row.exerciseId)}</option>
                    )}
                    {filteredExercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.name ?? ex.id}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
                  >
                    <Minus size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <input
                    type="number"
                    required
                    value={row.sets}
                    onChange={(e) => updateRow(index, { sets: e.target.value })}
                    placeholder="Sets"
                    className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white text-sm focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="number"
                    value={row.reps}
                    onChange={(e) => updateRow(index, { reps: e.target.value })}
                    placeholder="Reps"
                    className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white text-sm focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="number"
                    value={row.durationSeconds}
                    onChange={(e) => updateRow(index, { durationSeconds: e.target.value })}
                    placeholder="Durata (s)"
                    className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white text-sm focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="number"
                    value={row.weight}
                    onChange={(e) => updateRow(index, { weight: e.target.value })}
                    placeholder="Peso (kg)"
                    className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white text-sm focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="number"
                    value={row.restSeconds}
                    onChange={(e) => updateRow(index, { restSeconds: e.target.value })}
                    placeholder="Recupero (s)"
                    className="bg-gray-950 border border-gray-600 p-2 rounded-lg text-white text-sm focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="flex items-center justify-center gap-1 p-2 rounded-lg border border-dashed border-gray-600 text-gray-300 hover:bg-gray-700/50 text-xs uppercase font-bold"
            >
              <Plus size={14} /> Aggiungi esercizio
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-blue-400 text-gray-950 font-bold text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-300 transition-all"
          >
            {isSaving ? 'Salvataggio...' : isEditMode ? 'Salva nuova versione' : 'Crea Workout'}
          </button>
        </form>
      </div>
    </div>
  );
}
