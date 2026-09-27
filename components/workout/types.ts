// Client-side editing representation. Inputs are kept as raw strings (not
// numbers) so a field can be genuinely empty while the user is typing,
// rather than forcing a "0" they have to delete first. These are converted
// to validated numbers only when the workout is saved.
export type ClientSet = {
  id: string;
  weight: string;
  reps: string;
};

export type ClientExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: ClientSet[];
};
