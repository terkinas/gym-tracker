"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Exercise } from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:border-foreground/15">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-sm font-medium text-foreground">
          {exercise.name}
        </span>
        <Badge>{translateCategory(exercise.category, t)}</Badge>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t.common.actionsFor(exercise.name)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onEdit(exercise)}>
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
            {t.exercises.editAction}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(exercise)}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            {t.exercises.deleteAction}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
