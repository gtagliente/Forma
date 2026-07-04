import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import type { Routine } from '../../types';

export const RoutineCard = ({ routine }: { routine: Routine }) => {
  const totalExercises = routine.workouts.reduce((acc, w) => acc + w.exercises.length, 0);

  return (
    <Link 
      to={`/routine/${routine.id}`}
      className="block border border-gray-600 rounded-lg p-4 bg-gray-800 hover:border-gray-400 transition-all"
    >
      <h2 className="font-bold text-lg text-white mb-1">{routine.name}</h2>
      <div className="text-xs text-gray-400 mb-3">
        {routine.workouts.length} Workout • {totalExercises} Esercizi totali
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