import { Link } from 'react-router-dom';
import type { Workout } from '../../types';
import { Pencil, Share2 } from 'lucide-react';

export const WorkoutCard = ({ workout }: { workout: Workout }) => {
  return (
    <Link
      to={`/workout/${workout.id}`}
      className="max-w-screen-xl block border border-gray-600 rounded-lg p-3 shadow-sm hover:border-gray-400 transition-all bg-gray-800 group relative"
    >
      {/* Icona Modifica - più piccola e compatta */}
      <div className="absolute top-3 right-3 text-gray-500 group-hover:text-white transition-colors">
        <Pencil size={18} strokeWidth={2.5} />
      </div>
      {/* Titolo */}
      <h3 className="text-left font-bold text-md text-white mb-1 pr-6 pb-2 truncate">{workout.title}</h3>

      {/* Lista Esercizi - Senza punti, molto compatta */}
      <div className=" text-left text-xs text-gray-400 mb-2 truncate">
        <span className="font-semibold text-gray-300">{workout.exercises.length} esercizi: </span>
        <br></br>

        {workout.exercises.map((ex,idx) => (
          <>
            <span key={ex.id}>
            {ex.name}{idx < workout.exercises.length - 1 ? ' - ' : ''}
          </span>
          </>
        ))}
      </div>

      {/* Footer schiacciato */}
      <div className="pt-2 border-t border-gray-700 flex justify-start">
        <button
          onClick={(e) => {
            e.preventDefault();
            alert('Condividi!');
          }}
          className="text-[10px] uppercase font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1"
        >
          <Share2 size={12} /> {/* Icona Share */}

        </button>
      </div>
    </Link>
  );
};