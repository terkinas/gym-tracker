"use client";

import { Check, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ClientExercise } from "@/components/workout/types";
import { useTranslations } from "@/lib/i18n/locale-context";

interface CompletedExerciseRowProps {
  exercise: ClientExercise;
  /** Clears the completed state; the exercise's sets are untouched. */
  onReopen: () => void;
}

/** Collapsed form of a completed exercise: just title + Undo. The sets stay
 * in workout state (and in the DB) — they're only not rendered here. */
export function CompletedExerciseRow({ exercise, onReopen }: CompletedExerciseRowProps) {
  const t = useTranslations();

  return (
    <Card className="flex-row items-center justify-between gap-3 px-5 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Check
          className="h-4 w-4 shrink-0 text-primary"
          strokeWidth={2.5}
          aria-hidden="true"
        />
        <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
          {exercise.exerciseName}
        </h3>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReopen}
        className="shrink-0"
      >
        <Undo2 className="h-4 w-4" strokeWidth={1.75} />
        {t.workout.undoDoneAction}
      </Button>
    </Card>
  );
}
