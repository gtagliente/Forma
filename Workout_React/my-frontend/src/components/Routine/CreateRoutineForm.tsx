import { useState } from 'react';
import type { FormEvent } from 'react';
import type { RoutineEntry, Workout } from '../../types';
import { createRoutine, RoutineApiError } from '../../lib/api/routineApi';
import { X } from 'lucide-react';

interface DraftEntry {
  workoutId: string;
  dayOfWeek: number | null;
}

// Assumed .NET's System.DayOfWeek (Sunday=0..Saturday=6) - the contract only
// documents `dayOfWeek` as a nullable int with no enum values; this is the
// idiomatic default for a C# API and nothing in the schema contradicts it.
// Flagged in the design for Central Architect Gate confirmation before this
// mapping is treated as final.
const DAYS_OF_WEEK: { value: number; label: string }[] = [
  { value: 0, label: 'Domenica' },
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
];

// New inline create-panel (FT-004 design), rendered behind RoutineList's
// "+ Nuova scheda" toggle, in the existing dark-theme card language (Login/
// RoutineCard's bg-gray-800/border-gray-600/rounded-lg, blue-400 accent).
// `sequence` is not a form field - it's derived as each workout's 1-based
// position in the order it was added to the draft (no reorder UI), per the
// design's rationale: sequence/dayOfWeek are an explicitly provisional
// scheduling placeholder (training-planning-service/domain.md), so building
// reorder UI on top of it would be premature complexity.
export const CreateRoutineForm = ({
  ownerId,
  workouts,
  onClose,
  onCreated,
}: {
  ownerId: string;
  workouts: Workout[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) => {
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleWorkout = (workoutId: string) => {
    setEntries((current) =>
      current.some((e) => e.workoutId === workoutId)
        ? current.filter((e) => e.workoutId !== workoutId)
        : [...current, { workoutId, dayOfWeek: null }],
    );
  };

  const updateDayOfWeek = (workoutId: string, dayOfWeek: number | null) => {
    setEntries((current) =>
      current.map((e) => (e.workoutId === workoutId ? { ...e, dayOfWeek } : e)),
    );
  };

  const canSubmit = !isSaving && name.trim() !== '';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);

    const payloadEntries: RoutineEntry[] = entries.map((entry, index) => ({
      workoutId: entry.workoutId,
      dayOfWeek: entry.dayOfWeek,
      sequence: index + 1,
    }));

    try {
      await createRoutine(ownerId, name.trim(), payloadEntries);
      await onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof RoutineApiError ? err.message : 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-white">Nuova scheda</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label htmlFor="routine-name" className="block text-xs text-gray-400 mb-1">
            Nome
          </label>
          <input
            id="routine-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-gray-600 bg-gray-950 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="es. Training Forza Ipertrofia"
          />
        </div>

        <div>
          <span className="block text-xs text-gray-400 mb-1">Workout</span>
          {workouts.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun workout disponibile.</p>
          ) : (
            <div className="grid gap-2">
              {workouts.map((w) => {
                const entry = entries.find((e) => e.workoutId === w.id);
                const isSelected = Boolean(entry);
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 border border-gray-700 rounded-lg p-2 bg-gray-900/50"
                  >
                    <label className="flex flex-1 items-center gap-2 text-sm text-white">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleWorkout(w.id)} />
                      {w.name}
                    </label>
                    {isSelected && (
                      <select
                        value={entry?.dayOfWeek ?? ''}
                        onChange={(e) =>
                          updateDayOfWeek(w.id, e.target.value === '' ? null : Number(e.target.value))
                        }
                        className="rounded-lg border border-gray-600 bg-gray-950 text-white text-xs px-2 py-1 focus:outline-none focus:border-blue-400"
                      >
                        <option value="">Nessun giorno</option>
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-blue-400 text-gray-950 font-bold text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-300 transition-all"
        >
          {isSaving ? 'Salvataggio...' : 'Crea scheda'}
        </button>
      </form>
    </div>
  );
};
