"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Exercise } from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";

interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The user's exercises that aren't already in today's workout. */
  availableExercises: Exercise[];
  /** Whether the user has any exercises at all (before filtering out the
   * ones already added), to tell "no exercises yet" apart from "all of
   * your exercises are already in today's workout". */
  hasAnyExercises: boolean;
  onSelect: (exercise: Exercise) => void;
}

export function AddExerciseDialog({
  open,
  onOpenChange,
  availableExercises,
  hasAnyExercises,
  onSelect,
}: AddExerciseDialogProps) {
  const t = useTranslations();
  const [query, setQuery] = React.useState("");

  // Radix unmounts DialogContent when closed, so this naturally resets each
  // time the dialog re-opens — no effect needed.
  const trimmedQuery = query.trim().toLowerCase();
  const filteredExercises = trimmedQuery
    ? availableExercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(trimmedQuery),
      )
    : availableExercises;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.workout.addExerciseDialog.title}</DialogTitle>
          <DialogDescription>
            {t.workout.addExerciseDialog.description}
          </DialogDescription>
        </DialogHeader>

        {!hasAnyExercises ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t.workout.addExerciseDialog.noExercisesLine1}
              <br />
              {t.workout.addExerciseDialog.noExercisesLine2}
            </p>
            <Link
              href="/pratimai"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.workout.addExerciseDialog.goToExercises}
            </Link>
          </div>
        ) : availableExercises.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3.5 py-8 text-center text-sm text-muted-foreground">
            {t.workout.addExerciseDialog.allAdded}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.common.searchExercise.placeholder}
                aria-label={t.common.searchExercise.label}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
              {filteredExercises.length > 0 ? (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => onSelect(exercise)}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-foreground/15 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate text-sm font-medium text-foreground">
                      {exercise.name}
                    </span>
                    <Badge>{translateCategory(exercise.category, t)}</Badge>
                  </button>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-border px-3.5 py-6 text-center text-sm text-muted-foreground">
                  {t.workout.addExerciseDialog.noResults}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
