import { useState } from 'react';
import type { Exercise } from '../../types';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';

// New component (not a modification of ExerciseItem): ExerciseItem's body is
// hardcoded to the Workout-composition sets-editing shape, which no longer
// applies once Exercise/WorkoutExercise are split. Visually mirrors
// ExerciseItem's collapsed-header card shell as the closest existing
// precedent; its expanded body is read-only plus Edit/Delete affordances.
export const ExerciseLibraryItem = ({
  exercise,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex justify-between items-center text-white hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-semibold text-sm">{exercise.name ?? 'Senza nome'}</span>
        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
            <p className="text-sm text-gray-300 mb-3">{exercise.description ?? 'Nessuna descrizione'}</p>

            <div className="flex flex-wrap gap-1 mb-4">
              {(exercise.muscleGroups ?? []).map((group) => (
                <span
                  key={group}
                  className="text-[10px] uppercase font-bold text-gray-300 bg-gray-950 border border-gray-700 rounded px-2 py-1"
                >
                  {group}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(exercise)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 text-xs"
              >
                <Pencil size={14} /> Modifica
              </button>
              <button
                onClick={() => onDelete(exercise.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-700 text-red-400 hover:bg-gray-600 text-xs"
              >
                <Trash2 size={14} /> Elimina
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
