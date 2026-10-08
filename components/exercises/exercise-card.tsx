"use client";

import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CategoryTile, StatusBadge, categoryMeta } from "@/components/workout/workout-ui";
import { categoryColorClass } from "@/lib/category-colors";
import type { Exercise } from "@/lib/exercises";
import { translateCategory } from "@/lib/i18n/categories";
import { useTranslations } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  /** Briefly outlines a just-added exercise. */
  isHighlighted?: boolean;
  /** Fades the row out while it is being removed from the list. */
  isLeaving?: boolean;
}

const ACTION_BUTTON =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent/70 disabled:pointer-events-none sm:h-9 sm:w-9";

export function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
  isHighlighted = false,
  isLeaving = false,
}: ExerciseCardProps) {
  const t = useTranslations();
  const accent = categoryMeta(exercise.category);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card py-3 pr-2 pl-5 transition-[background-color,border-color,opacity,transform] duration-200 hover:border-foreground/15 hover:bg-accent/40 focus-within:border-foreground/15 sm:pr-3",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200",
        isHighlighted && "border-primary/40 bg-primary/5",
        isLeaving && "pointer-events-none scale-[0.98] opacity-0 motion-reduce:scale-100",
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", accent.bar)} />

      <CategoryTile category={exercise.category} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="line-clamp-2 text-sm leading-snug font-medium break-words text-foreground sm:text-base">
          {exercise.name}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            className={cn("px-2 py-0 text-[0.7rem] leading-5", categoryColorClass(exercise.category))}
          >
            {translateCategory(exercise.category, t)}
          </Badge>
          {exercise.isOneHanded && (
            <StatusBadge icon={ArrowLeftRight}>{t.workout.oneHandedBadge}</StatusBadge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center sm:gap-0.5">
        <button
          type="button"
          onClick={() => onEdit(exercise)}
          aria-label={t.exercises.editFor(exercise.name)}
          title={t.exercises.editAction}
          className={cn(ACTION_BUTTON, "hover:bg-accent hover:text-foreground")}
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(exercise)}
          aria-label={t.exercises.deleteFor(exercise.name)}
          title={t.exercises.deleteAction}
          className={cn(ACTION_BUTTON, "hover:bg-destructive/10 hover:text-destructive")}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
