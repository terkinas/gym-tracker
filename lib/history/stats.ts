import { workoutHardSetCount, workoutSetCount } from "@/lib/progress/analytics";
import type { Workout } from "@/lib/types/workout";

export type WorkoutStats = {
  exerciseCount: number;
  setCount: number;
  /** Sets flagged as hard sets — the app's volume measure. */
  hardSetCount: number;
};

export function getWorkoutStats(workout: Workout): WorkoutStats {
  return {
    exerciseCount: workout.exercises.length,
    setCount: workoutSetCount(workout),
    hardSetCount: workoutHardSetCount(workout),
  };
}
