// Weekly muscle volume, counted in hard sets (weight is never used).
//
// - direct:   hard sets of exercises whose primary muscle (`category`) is the
//             muscle. This is the number that IS the weekly volume.
// - indirect: hard sets of exercises that list the muscle as a SECONDARY
//             muscle (e.g. triceps during bench press). Information only —
//             it is never added to `direct`.

import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import type { Exercise, ExerciseCategory } from "@/lib/exercises";
import { addDaysToDateString } from "@/lib/progress/analytics";
import type { Workout } from "@/lib/types/workout";

export type MuscleVolume = {
  muscle: ExerciseCategory;
  direct: number;
  indirect: number;
};

/** Per-muscle direct/indirect hard sets for the 7 days starting at
 * `weekStart` (a Monday, `YYYY-MM-DD`), in the fixed category order. */
export function getWeeklyMuscleVolume(
  workouts: Workout[],
  exercises: Exercise[],
  weekStart: string,
): MuscleVolume[] {
  const weekEnd = addDaysToDateString(weekStart, 6);
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  const totals = new Map<ExerciseCategory, MuscleVolume>(
    EXERCISE_CATEGORIES.map((muscle) => [muscle, { muscle, direct: 0, indirect: 0 }]),
  );

  for (const workout of workouts) {
    if (workout.date < weekStart || workout.date > weekEnd) continue;

    for (const entry of workout.exercises) {
      // An exercise deleted since the workout was saved can't be attributed.
      const exercise = exerciseById.get(entry.exerciseId);
      if (!exercise) continue;

      const hardSets = entry.sets.filter((set) => set.isHardSet).length;
      if (hardSets === 0) continue;

      const primary = totals.get(exercise.category);
      if (primary) primary.direct += hardSets;

      // A muscle that is the primary one never also counts as indirect.
      for (const muscle of new Set(exercise.secondaryMuscles)) {
        if (muscle === exercise.category) continue;
        const secondary = totals.get(muscle);
        if (secondary) secondary.indirect += hardSets;
      }
    }
  }

  return EXERCISE_CATEGORIES.map((muscle) => totals.get(muscle)!);
}
