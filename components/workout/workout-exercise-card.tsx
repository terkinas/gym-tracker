"use client";

import { Check, Circle, MoreVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkoutSetRow, setGridClass } from "@/components/workout/workout-set-row";
import type { ClientExercise } from "@/components/workout/types";
import { formatCount } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import type { LastExerciseSession } from "@/lib/storage/workouts";
import type { SetHand } from "@/lib/types/workout";

interface WorkoutExerciseCardProps {
  exercise: ClientExercise;
  /** Informational only — never pre-fills or alters the current sets. */
  lastTime: LastExerciseSession | null;
  /** The exercise currently being worked on (UI-only; shows the NOW badge). */
  isActive: boolean;
  /** The id of the most recently added set (across all exercises), so its
   * weight input can grab focus once, right when its row first mounts. */
  justAddedSetId: string | null;
  onChangeSetWeight: (setId: string, value: string) => void;
  onChangeSetReps: (setId: string, value: string) => void;
  onChangeSetHand: (setId: string, value: SetHand) => void;
  onChangeSetHardSet: (setId: string, value: boolean) => void;
  onDeleteSet: (setId: string) => void;
  onAddSet: () => void;
  onRequestRemove: () => void;
  onDone: () => void;
  /** This exercise's "Done" save is in flight (spinner on its button). */
  isSavingDone?: boolean;
  /** Any workout save is in flight; blocks a second one. */
  disabled?: boolean;
}

export function WorkoutExerciseCard({
  exercise,
  lastTime,
  isActive,
  justAddedSetId,
  onChangeSetWeight,
  onChangeSetReps,
  onChangeSetHand,
  onChangeSetHardSet,
  onDeleteSet,
  onAddSet,
  onRequestRemove,
  onDone,
  isSavingDone = false,
  disabled = false,
}: WorkoutExerciseCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const hasSets = exercise.sets.length > 0;

  return (
    <Card className={cn("gap-4 p-5 sm:p-6", isActive && "border-primary/40")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate text-base font-semibold text-foreground">
              {exercise.exerciseName}
            </h3>
            {isActive && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-primary uppercase">
                <Circle
                  className="h-2 w-2 animate-pulse fill-current motion-reduce:animate-none"
                  aria-hidden="true"
                />
                {t.workout.nowBadge}
              </span>
            )}
          </div>
          {lastTime && lastTime.sets.length > 0 && (
            <p className="min-w-0 text-xs break-words text-muted-foreground">
              <span className="font-medium">{t.workout.lastTime}:</span>{" "}
              {lastTime.sets
                .map(
                  (set) =>
                    `${formatCount(set.weight, locale)} ${t.records.units.kg} × ${formatCount(set.reps, locale)}${
                      exercise.isOneHanded && set.hand
                        ? ` — ${t.workout.hand[set.hand]}`
                        : ""
                    }`,
                )
                .join(", ")}
            </p>
          )}
          {exercise.isOneHanded && (
            <p className="text-xs text-muted-foreground">
              {t.workout.oneHandedHint}
            </p>
          )}
        </div>

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
          <div className={`grid ${setGridClass(exercise.isOneHanded)}`}>
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t.workout.setsHeader.number}
            </span>
            <span className="text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t.workout.setsHeader.weight}
            </span>
            <span className="text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t.workout.setsHeader.reps}
            </span>
            {exercise.isOneHanded && (
              <span className="text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {t.workout.hand.label}
              </span>
            )}
            <span className="text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {t.workout.setsHeader.hard}
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
              isOneHanded={exercise.isOneHanded}
              autoFocus={set.id === justAddedSetId}
              onChangeWeight={(value) => onChangeSetWeight(set.id, value)}
              onChangeReps={(value) => onChangeSetReps(set.id, value)}
              onChangeHand={(value) => onChangeSetHand(set.id, value)}
              onChangeHardSet={(value) => onChangeSetHardSet(set.id, value)}
              onDelete={() => onDeleteSet(set.id)}
            />
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            {t.workout.noSetsYet}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onAddSet}
          className="h-[2.625rem] w-full text-sm sm:w-auto"
        >
          <Plus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
          {t.workout.addSet}
        </Button>

        <Button
          type="button"
          onClick={onDone}
          loading={isSavingDone}
          disabled={disabled}
          className="h-[2.625rem] w-full text-sm sm:w-auto"
        >
          {!isSavingDone && <Check className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />}
          {t.workout.doneWithExercise}
        </Button>
      </div>
    </Card>
  );
}
