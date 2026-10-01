import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Exercise } from "@/lib/exercises";
import { getWorkoutStats } from "@/lib/history/stats";
import { translateCategory } from "@/lib/i18n/categories";
import type { Locale } from "@/lib/i18n/config";
import { formatCount, formatDate, formatVolume, pluralizeThree } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/translations";
import type { Workout } from "@/lib/types/workout";

const PREVIEW_EXERCISES = 3;

export function HistoryCard({
  workout,
  exerciseById,
  t,
  locale,
}: {
  workout: Workout;
  exerciseById: Map<string, Exercise>;
  t: Dictionary;
  locale: Locale;
}) {
  const stats = getWorkoutStats(workout);
  const displayDate = formatDate(workout.date, locale);

  const names = workout.exercises.map(
    (e) => exerciseById.get(e.exerciseId)?.name ?? t.history.unknownExercise,
  );
  const categories = [
    ...new Set(
      workout.exercises
        .map((e) => exerciseById.get(e.exerciseId)?.category)
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    ),
  ];
  const previewNames = names.slice(0, PREVIEW_EXERCISES);
  const remaining = names.length - previewNames.length;

  return (
    <Link
      href={`/istorija/${workout.id}`}
      aria-label={t.history.openWorkout(displayDate)}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/15 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {displayDate}
        </h2>

        <p className="text-sm text-muted-foreground">
          {formatCount(stats.exerciseCount, locale)}{" "}
          {pluralizeThree(locale, stats.exerciseCount, t.history.exercisesWord)} ·{" "}
          {formatCount(stats.setCount, locale)}{" "}
          {pluralizeThree(locale, stats.setCount, t.history.setsWord)}
        </p>
        <p className="text-sm font-medium text-foreground">
          {formatVolume(stats.totalVolume, locale)}
        </p>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Badge key={category}>{translateCategory(category, t)}</Badge>
            ))}
          </div>
        )}

        {previewNames.length > 0 && (
          <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
            {previewNames.map((name, index) => (
              <li key={`${name}-${index}`} className="truncate">
                {name}
              </li>
            ))}
            {remaining > 0 && (
              <li className="text-xs">{t.history.moreExercises(remaining)}</li>
            )}
          </ul>
        )}
      </div>

      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </Link>
  );
}
