import { Link } from 'react-router-dom';
import type { Workout } from '../../types';
import { Pencil, Share2 } from 'lucide-react';

// New optional exerciseNames/onEdit props (FT-003): exerciseNames defaults
// to {} so the existing RoutineDetail-nested call site (`<WorkoutCard
// workout={w} />`, no new props) keeps working unchanged - raw exerciseId
// shows in place of a name there. onEdit stays undefined there too, so the
// Pencil icon keeps its exact current no-op behavior (falls through to card
// navigation) - only WorkoutsPage wires it.
export const WorkoutCard = ({
  workout,
  exerciseNames = {},
  onEdit,
}: {
  workout: Workout;
  exerciseNames?: Record<string, string>;
  onEdit?: (workout: Workout) => void;
}) => {
  return (
    <Link
      to={`/workout/${workout.id}`}
      className="max-w-screen-xl block border border-gray-600 rounded-lg p-3 shadow-sm hover:border-gray-400 transition-all bg-gray-800 group relative"
    >
      {/* Icona Modifica - più piccola e compatta */}
      <div
        className="absolute top-3 right-3 text-gray-500 group-hover:text-white transition-colors"
        onClick={onEdit ? (e) => { e.preventDefault(); onEdit(workout); } : undefined}
      >
        <Pencil size={18} strokeWidth={2.5} />
      </div>
      {/* Titolo */}
      <h3 className="text-left font-bold text-md text-white mb-1 pr-6 pb-2 truncate">{workout.name}</h3>

      {/* Lista Esercizi - Senza punti, molto compatta */}
      <div className=" text-left text-xs text-gray-400 mb-2 truncate">
        <span className="font-semibold text-gray-300">{workout.exercises.length} esercizi: </span>
        <br></br>

        {workout.exercises.map((entry,idx) => (
          <>
            <span key={entry.exerciseId}>
            {exerciseNames[entry.exerciseId] ?? entry.exerciseId}{idx < workout.exercises.length - 1 ? ' - ' : ''}
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