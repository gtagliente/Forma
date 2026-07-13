import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import type { Routine } from '../../types';

// exerciseCount is precomputed by the caller (RoutineList, which already
// fetches the workout list to build a workoutsById map) - FT-004: the real
// Routine response carries no embedded Workout/exercise data, only
// entries[].workoutId references, so the total can no longer be derived
// locally from routine.workouts. Presentational component, same two numbers
// its JSX already showed - JSX/CSS unchanged.
export const RoutineCard = ({ routine, exerciseCount }: { routine: Routine; exerciseCount: number }) => {
  return (
    <Link
      to={`/routine/${routine.id}`}
      className="block border border-gray-600 rounded-lg p-4 bg-gray-800 hover:border-gray-400 transition-all"
    >
      <h2 className="font-bold text-lg text-white mb-1">{routine.name}</h2>
      <div className="text-xs text-gray-400 mb-3">
        {routine.entries.length} Workout • {exerciseCount} Esercizi totali
      </div>
      <div className="pt-3 border-t border-gray-700 flex justify-between items-center">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Scheda Attiva</span>
        <div className="text-blue-400">
          <Layers size={16} />
        </div>
      </div>
    </Link>
  );
};