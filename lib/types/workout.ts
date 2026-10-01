// Types prepared for a future phase. `/treniruote` will let a user pick an
// exercise, add sets, and save a workout for a given date — this phase only
// defines the shape so the data model is settled ahead of time.

/** Arm a set was performed with (one-handed exercises only). */
export type SetHand = "left" | "right";

export function isSetHand(value: unknown): value is SetHand {
  return value === "left" || value === "right";
}

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  /** null for non-one-handed exercises and for legacy one-handed sets. */
  hand: SetHand | null;
};

export type WorkoutExercise = {
  exerciseId: string;
  /** "I'm done with this exercise" was tapped (persisted per workout exercise). */
  completed: boolean;
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
