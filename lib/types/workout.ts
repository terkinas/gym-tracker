// Types prepared for a future phase. `/treniruote` will let a user pick an
// exercise, add sets, and save a workout for a given date — this phase only
// defines the shape so the data model is settled ahead of time.

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
};

export type WorkoutExercise = {
  exerciseId: string;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  userId: string;
  /** ISO date string, e.g. "2026-09-26" — one workout per user per date. */
  date: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
};
