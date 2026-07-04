import { useParams, Link } from 'react-router-dom';
import type { Routine } from '../types';
import { ExerciseItem } from '../components/Exercise/ExerciseItem'; // Assicurati che il path sia giusto
import { ArrowLeft } from 'lucide-react';

export const WorkoutDetail = ({ routines }: { routines: Routine[] }) => {
  const { id } = useParams();

  // Scaviamo dentro le routine per trovare il workout
  const workout = routines
    .flatMap(r => r.workouts)
    .find(w => w.id === id);

  const routineId = routines.find(r => r.workouts.find(w => w.id == workout?.id))?.id;

  if (!workout) {
    return <div className="text-white p-8">Workout non trovato</div>;
  }

  return (
    <div className="p-4 max-w-screen-xl  min-h-screen bg-gray-950 text-white">
      {/* Bottone Indietro */}
      <Link to={`/routine/${routineId}`} className="flex max-w-screen-xl items-center text-gray-400 text-sm mb-6">
        <ArrowLeft size={16} className="mr-1" /> Torna alla routine
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">{workout.title}</h1>
      
      {/* Lista degli esercizi (Accordion) */}
      <div className="grid gap-2">
        {workout.exercises.map(ex => (
          <ExerciseItem key={ex.id} exercise={ex} />
        ))}
      </div>
    </div>
  );
};