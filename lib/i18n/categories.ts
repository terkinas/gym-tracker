import type { ExerciseCategory } from "@/lib/exercises";
import type { Dictionary } from "@/lib/i18n/translations";

/** Translates a stored exercise category (always the original Lithuanian
 * value, e.g. "Krūtinė") into the current locale's display label. The
 * stored value itself is never changed — this only affects what's
 * rendered, so existing JSON data and category filtering keep working
 * unmodified regardless of the selected language. */
export function translateCategory(category: ExerciseCategory, t: Dictionary): string {
  return t.categories[category];
}
