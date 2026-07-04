import { useParams, Link } from 'react-router-dom';
import type { Routine } from '../types';
import { WorkoutCard } from '../components/Workout/WorkoutCard';
import { ArrowLeft } from 'lucide-react';

export const RoutineDetail = ({ routines }: { routines: Routine[] }) => {
  const { id } = useParams();
  const routine = routines.find(r => r.id === id);

  if (!routine) {
    return <div className="text-white p-8">Routine non trovata</div>;
  }

  return (
    <div className="p-4 max-w-screen-xl min-h-screen bg-gray-950">
      {/* Header con tasto Indietro */}
      <div className="mb-6">
        <Link to="/" className="flex items-center text-gray-400 hover:text-white text-sm mb-4">
          <ArrowLeft size={16} className="mr-1" /> Torna alle schede
        </Link>
        <h1 className="text-2xl font-bold text-white">{routine.name}</h1>
        <p className="text-gray-500 text-xs mt-1">
          {routine.workouts.length} Allenamenti pianificati
        </p>
      </div>

      {/* Lista dei Workout appartenenti a questa routine */}
      <div className="grid gap-3">
        {routine.workouts.map(w => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </div>
  );
};