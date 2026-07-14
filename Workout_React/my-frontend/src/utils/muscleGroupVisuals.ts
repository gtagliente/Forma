import { Dumbbell, PersonStanding, Footprints, ArrowUpFromLine, BicepsFlexed, CircleDot, Activity } from 'lucide-react';
import type { MuscleGroup } from '../types';

// One representative icon + accent color per MuscleGroup, used to give each
// exercise row a quick visual identity (per the redesign asking for an icon
// per exercise). Picks the first entry when an exercise trains several
// groups - a single badge is a hint, not an exhaustive summary.
const VISUALS: Record<MuscleGroup, { icon: typeof Dumbbell; className: string }> = {
  Chest: { icon: Dumbbell, className: 'bg-blue-500/15 text-blue-400' },
  Back: { icon: ArrowUpFromLine, className: 'bg-violet-500/15 text-violet-400' },
  Legs: { icon: Footprints, className: 'bg-emerald-500/15 text-emerald-400' },
  Shoulders: { icon: PersonStanding, className: 'bg-amber-500/15 text-amber-400' },
  Arms: { icon: BicepsFlexed, className: 'bg-rose-500/15 text-rose-400' },
  Core: { icon: CircleDot, className: 'bg-teal-500/15 text-teal-400' },
  FullBody: { icon: Activity, className: 'bg-cyan-500/15 text-cyan-400' },
};

const DEFAULT_VISUAL = { icon: Dumbbell, className: 'bg-gray-500/15 text-gray-400' };

export const getExerciseVisual = (muscleGroups?: MuscleGroup[] | null) =>
  (muscleGroups && muscleGroups.length > 0 ? VISUALS[muscleGroups[0]] : undefined) ?? DEFAULT_VISUAL;
