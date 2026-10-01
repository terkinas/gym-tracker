import { workoutSetCount, workoutTotalVolume } from "@/lib/progress/analytics";
import type { Workout } from "@/lib/types/workout";

export type WorkoutStats = {
  exerciseCount: number;
  setCount: number;
  /** Σ weight × reps — the same calculation the progress dashboard uses. */
  totalVolume: number;
};

export function getWorkoutStats(workout: Workout): WorkoutStats {
  return {
    exerciseCount: workout.exercises.length,
    setCount: workoutSetCount(workout),
    totalVolume: workoutTotalVolume(workout),
  };
}
