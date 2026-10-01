export const EXERCISE_CATEGORIES = [
  "Krūtinė",
  "Pečiai",
  "Bicepsas",
  "Tricepsas",
  "Nugara",
  "Presas",
  "Kojos",
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export type Exercise = {
  id: string;
  userId: string;
  name: string;
  category: ExerciseCategory;
  /** Performed one arm at a time, but weight/reps are logged once per set
   * for both arms combined. */
  isOneHanded: boolean;
  createdAt: string;
};

/** Fields a user can set when creating/editing an exercise. */
export type ExerciseInput = {
  name: string;
  category: ExerciseCategory;
  isOneHanded: boolean;
};

// The predefined "CityGym" exercise set offered to a user with zero
// exercises via the "Import CityGym Defaults" action. Names are kept in
// English exactly as specified and are never translated — only the
// (already-Lithuanian) category values feed the existing category display
// translation in lib/i18n/categories.ts.
export const CITYGYM_DEFAULT_EXERCISES: readonly {
  name: string;
  category: ExerciseCategory;
  isOneHanded?: boolean;
}[] = [
  // Krūtinė / Chest
  { name: "Incline Bench Press", category: "Krūtinė" },
  { name: "Chest Dips", category: "Krūtinė" },
  { name: "Pec Deck", category: "Krūtinė" },
  // Pečiai / Shoulders
  { name: "Lateral Raise Machine", category: "Pečiai" },
  { name: "Machine Shoulder Press", category: "Pečiai" },
  { name: "Single-Arm Lateral Raise", category: "Pečiai", isOneHanded: true },
  // Bicepsas / Biceps
  { name: "Biceps Curl Machine", category: "Bicepsas" },
  { name: "Dumbbell Supinating Curl", category: "Bicepsas", isOneHanded: true },
  { name: "Cable Barbell Curl", category: "Bicepsas" },
  // Tricepsas / Triceps
  { name: "Overhead Cable Triceps Extension", category: "Tricepsas" },
  { name: "Triceps Press Machine", category: "Tricepsas" },
  { name: "Triceps Dips", category: "Tricepsas" },
  { name: "Rope Triceps Pushdown", category: "Tricepsas" },
  // Nugara / Back
  { name: "Lat Pulldown", category: "Nugara" },
  { name: "Straight-Arm Pulldown", category: "Nugara" },
  { name: "Back Extension", category: "Nugara" },
  { name: "Seated Row Machine", category: "Nugara" },
  // Presas / Abs
  { name: "Kneeling Cable Crunch", category: "Presas" },
  { name: "Crunches", category: "Presas" },
  // Kojos / Legs
  { name: "Barbell Squat", category: "Kojos" },
  { name: "Leg Extension", category: "Kojos" },
  { name: "Lying Leg Curl", category: "Kojos" },
  { name: "Hip Abduction Machine", category: "Kojos" },
  { name: "Hip Adduction Machine", category: "Kojos" },
  { name: "Standing Calf Raise", category: "Kojos" },
] as const;
