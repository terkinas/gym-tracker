import type { ExerciseCategory } from "@/lib/exercises";

// One colour per muscle category, used for the category labels. Classes are
// written out in full (no string building) so Tailwind can see them. Each is
// a tinted background + border + readable text colour, for light and dark.
export const CATEGORY_COLOR_CLASSES: Record<ExerciseCategory, string> = {
  Krūtinė: "border-orange-500/30 bg-orange-500/15 text-orange-700 dark:text-orange-300", // chest
  Pečiai: "border-yellow-500/30 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300", // shoulders
  Bicepsas: "border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-300",
  Tricepsas: "border-cyan-500/30 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  Nugara: "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300", // back
  Presas: "border-violet-500/30 bg-violet-500/15 text-violet-700 dark:text-violet-300", // abs
  Kojos: "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300", // legs
};

export function categoryColorClass(category: ExerciseCategory): string {
  return CATEGORY_COLOR_CLASSES[category];
}
