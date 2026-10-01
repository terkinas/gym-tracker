// Client-side editing representation. Inputs are kept as raw strings (not
// numbers) so a field can be genuinely empty while the user is typing,
// rather than forcing a "0" they have to delete first. These are converted
// to validated numbers only when the workout is saved.
import type { SetHand } from "@/lib/types/workout";

export type ClientSet = {
  id: string;
  weight: string;
  reps: string;
  /** Arm used for this set. Only used when the exercise is one-handed;
   * null = not chosen yet (required before saving). */
  hand: SetHand | null;
};

export type ClientExercise = {
  exerciseId: string;
  exerciseName: string;
  /** Each set records which arm it was performed with. */
  isOneHanded: boolean;
  /** The user tapped "I'm done with this exercise". The exercise stays
   * in state (sets kept, still saved, picker doesn't offer it again) but is
   * rendered as a compact row (title + Undo) instead of the full card.
   * Persisted as
   * WorkoutExercise.completed (immediately if the exercise is already saved,
   * otherwise with the next explicit Save). */
  isDone: boolean;
  sets: ClientSet[];
};
