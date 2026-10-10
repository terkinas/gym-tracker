// Types prepared for a future phase. `/treniruote` will let a user pick an
// exercise, add sets, and save a workout for a given date — this phase only
// defines the shape so the data model is settled ahead of time.

/** Side a set was performed on (individual / one-sided exercises only). */
export type SetHand = "left" | "right";

export function isSetHand(value: unknown): value is SetHand {
  return value === "left" || value === "right";
}

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  /** null for non-individual exercises and for legacy one-handed sets. */
  hand: SetHand | null;
  /** Counts as a "hard set" (taken close to failure) for weekly volume. */
  isHardSet: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  /** "I'm done with this exercise" was tapped (persisted per workout exercise). */
  completed: boolean;
  /** Bodyweight exercise: set weights are extra weight on top of the user's
   * saved body weight (0 = bodyweight only). */
  usesBodyweight: boolean;
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

/** The only workout fields the progress / records / score calculations read
 * (see lib/progress/*). A full `Workout` is assignable to it. Loading and
 * shipping just this shape — no ids, timestamps, hands or flags — keeps the
 * analytics queries and the `/progress` client payload small. */
export type AnalyticsWorkout = {
  date: string;
  exercises: {
    exerciseId: string;
    sets: { weight: number; reps: number; isHardSet: boolean }[];
  }[];
};
