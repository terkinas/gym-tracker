"use client";

import { MoreVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkoutSetRow } from "@/components/workout/workout-set-row";
import type { ClientExercise } from "@/components/workout/types";
import { useTranslations } from "@/lib/i18n/locale-context";

interface WorkoutExerciseCardProps {
  exercise: ClientExercise;
  /** The id of the most recently added set (across all exercises), so its
   * weight input can grab focus once, right when its row first mounts. */
  justAddedSetId: string | null;
  onChangeSetWeight: (setId: string, value: string) => void;
  onChangeSetReps: (setId: string, value: string) => void;
  onDeleteSet: (setId: string) => void;
  onAddSet: () => void;
  onRequestRemove: () => void;
}

export function WorkoutExerciseCard({
  exercise,
  justAddedSetId,
  onChangeSetWeight,
  onChangeSetReps,
  onDeleteSet,
  onAddSet,
  onRequestRemove,
}: WorkoutExerciseCardProps) {
  const t = useTranslations();
  const hasSets = exercise.sets.length > 0;

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
          {exercise.exerciseName}
        </h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t.common.actionsFor(exercise.exerciseName)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive" onSelect={onRequestRemove}>
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              {t.workout.removeExerciseAction}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-2.5">
        {hasSets && (
          <div className="grid grid-cols-[1.75rem_1fr_1fr_2rem] gap-2.5 sm:grid-cols-[2rem_5rem_5rem_2rem] sm:gap-3">
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t.workout.setsHeader.number}
            </span>
            <span className="text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t.workout.setsHeader.weight}
            </span>
            <span className="text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t.workout.setsHeader.reps}
            </span>
            <span />
          </div>
        )}

        {hasSets ? (
          exercise.sets.map((set, index) => (
            <WorkoutSetRow
              key={set.id}
              set={set}
              setNumber={index + 1}
              autoFocus={set.id === justAddedSetId}
              onChangeWeight={(value) => onChangeSetWeight(set.id, value)}
              onChangeReps={(value) => onChangeSetReps(set.id, value)}
              onDelete={() => onDeleteSet(set.id)}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            {t.workout.noSetsYet}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddSet}
        className="self-start"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        {t.workout.addSet}
      </Button>
    </Card>
  );
}
