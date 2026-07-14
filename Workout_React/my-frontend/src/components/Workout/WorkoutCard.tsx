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
      className="max-w-screen-xl block rounded-xl border border-white/10 bg-[#0d1220]/70 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all hover:border-blue-400/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] group relative"
    >
      {/* Icona Modifica - più piccola e compatta */}
      <div
        className="absolute top-4 right-4 text-gray-500 group-hover:text-white transition-colors"
        onClick={onEdit ? (e) => { e.preventDefault(); onEdit(workout); } : undefined}
      >
        <Pencil size={18} strokeWidth={2.5} />
      </div>
      {/* Titolo */}
      <h3 className="text-left font-bold text-md text-white mb-2 pr-6 truncate">{workout.name}</h3>

      {/* Lista Esercizi - Senza punti, molto compatta */}
      <div className="text-left text-xs text-gray-400 mb-3 truncate">
        <span className="font-semibold text-gray-300">{workout.exercises.length} esercizi: </span>
        <br></br>

        {workout.exercises.map((entry,idx) => (
          <span key={entry.exerciseId}>
            {exerciseNames[entry.exerciseId] ?? entry.exerciseId}{idx < workout.exercises.length - 1 ? ' - ' : ''}
          </span>
        ))}
      </div>

      {/* Footer schiacciato */}
      <div className="pt-2 border-t border-white/10 flex justify-start">
        <button
          onClick={(e) => {
            e.preventDefault();
            alert('Condividi!');
          }}
          className="text-[10px] uppercase font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
        >
          <Share2 size={12} /> {/* Icona Share */}

        </button>
      </div>
    </Link>
  );
};