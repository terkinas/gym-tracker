"use client";

import { Check, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ClientExercise } from "@/components/workout/types";
import { CategoryTile } from "@/components/workout/workout-ui";
import type { ExerciseCategory } from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";

interface CompletedExerciseRowProps {
  exercise: ClientExercise;
  /** UI only: tints the icon. Unknown → neutral. */
  category?: ExerciseCategory;
  /** Clears the completed state; the exercise's sets are untouched. */
  onReopen: () => void;
}

/** Collapsed form of a completed exercise: icon + title + "Done" + Undo. The
 * sets stay in workout state (and in the DB) — they're only not rendered. */
export function CompletedExerciseRow({ exercise, category, onReopen }: CompletedExerciseRowProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card/50 py-1.5 pr-1.5 pl-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      <CategoryTile category={category} className="h-8 w-8 rounded-lg opacity-70" />
      <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
        {exercise.exerciseName}
      </h3>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary/80">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span className="sr-only min-[420px]:not-sr-only">{t.workout.doneBadge}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReopen}
        className="h-11 shrink-0 rounded-xl px-3 text-muted-foreground active:scale-[0.97] hover:text-foreground"
      >
        <Undo2 className="h-4 w-4" strokeWidth={1.75} />
        {t.workout.undoDoneAction}
      </Button>
    </div>
  );
}
