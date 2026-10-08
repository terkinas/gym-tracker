// Client-side editing representation. Inputs are kept as raw strings (not
// numbers) so a field can be genuinely empty while the user is typing,
// rather than forcing a "0" they have to delete first. These are converted
// to validated numbers only when the workout is saved.
import type { SetHand } from "@/lib/types/workout";

export type ClientSet = {
  id: string;
  weight: string;
  reps: string;
  /** Side (left / right) used for this set. Only used when the exercise is
   * individual (one side at a time); null = not chosen yet (required before
   * saving). */
  hand: SetHand | null;
  /** "Hard set" checkbox: counts towards weekly muscle volume. */
  isHardSet: boolean;
};

export type ClientExercise = {
  exerciseId: string;
  exerciseName: string;
  /** Individual exercise (arm, leg, shoulder…): each set records which side it
   * was performed on. Stored as `Exercise.isOneHanded` (column name unchanged). */
  isOneHanded: boolean;
  /** The user tapped "I'm done with this exercise" (or saved the whole
   * workout with the master Save button while this exercise was open and had
   * sets logged). The exercise stays
   * in state (sets kept, still saved, picker doesn't offer it again) but is
   * rendered as a compact row (title + Undo) instead of the full card.
   * Persisted as
   * WorkoutExercise.completed (immediately if the exercise is already saved,
   * otherwise with the next explicit Save). */
  isDone: boolean;
  /** Bodyweight exercise: the KG picker is the EXTRA weight on top of the
   * workout's body weight (0 = bodyweight only). Persisted per exercise. */
  usesBodyweight: boolean;
  sets: ClientSet[];
};
