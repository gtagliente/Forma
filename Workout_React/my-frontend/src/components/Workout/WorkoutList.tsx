import type { Workout } from '../../types';
import { WorkoutCard } from './WorkoutCard';

// Resurrected per FT-003 design: was entirely commented out, dead code, not
// imported or rendered anywhere. Presentational grid for WorkoutsPage - owns
// no state, no fetching; workouts/exerciseNames/onEdit are all passed down
// from the container, close to the original commented shape but rendering
// the real WorkoutCard (not the old inline card markup) for visual
// consistency with the existing Routine-nested rendering in RoutineDetail.
export default function WorkoutList({
  workouts,
  exerciseNames,
  onEdit,
}: {
  workouts: Workout[];
  exerciseNames: Record<string, string>;
  onEdit?: (workout: Workout) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} exerciseNames={exerciseNames} onEdit={onEdit} />
      ))}
    </div>
  );
}
