"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Circle,
  MoreVertical,
  PersonStanding,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkoutSetRow, setGridClass } from "@/components/workout/workout-set-row";
import { CategoryTile, StatusBadge, categoryMeta } from "@/components/workout/workout-ui";
import type { ClientExercise } from "@/components/workout/types";
import type { ExerciseCategory } from "@/lib/exercises";
import { translateCategory } from "@/lib/i18n/categories";
import { formatCount } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import type { LastExerciseSession } from "@/lib/storage/workouts";
import { effectiveLoad } from "@/lib/workout/body-weight";
import type { SetHand } from "@/lib/types/workout";

interface WorkoutExerciseCardProps {
  exercise: ClientExercise;
  /** UI only: accent colour + icon. Unknown → neutral. */
  category?: ExerciseCategory;
  /** Informational only — never pre-fills or alters the current sets. */
  lastTime: LastExerciseSession | null;
  /** The user's SAVED body weight (kg) or null; used when `usesBodyweight`. */
  bodyWeight: number | null;
  /** The exercise currently being worked on (UI-only; shows the NOW badge). */
  isActive: boolean;
  /** The id of the most recently added set (across all exercises), so its
   * weight input can grab focus once, right when its row first mounts. */
  justAddedSetId: string | null;
  onChangeSetWeight: (setId: string, value: string) => void;
  onChangeSetReps: (setId: string, value: string) => void;
  onChangeSetHand: (setId: string, value: SetHand) => void;
  onChangeSetHardSet: (setId: string, value: boolean) => void;
  onChangeUsesBodyweight: (value: boolean) => void;
  onDeleteSet: (setId: string) => void;
  onAddSet: () => void;
  onRequestRemove: () => void;
  onDone: () => void;
  /** This exercise's "Done" save is in flight (spinner on its button). */
  isSavingDone?: boolean;
  /** Any workout save is in flight; blocks a second one. */
  disabled?: boolean;
}

const HEADER_CELL = "text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase";

export function WorkoutExerciseCard({
  exercise,
  category,
  lastTime,
  bodyWeight,
  isActive,
  justAddedSetId,
  onChangeSetWeight,
  onChangeSetReps,
  onChangeSetHand,
  onChangeSetHardSet,
  onChangeUsesBodyweight,
  onDeleteSet,
  onAddSet,
  onRequestRemove,
  onDone,
  isSavingDone = false,
  disabled = false,
}: WorkoutExerciseCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const hasSets = exercise.sets.length > 0;
  const accent = categoryMeta(category);

  // A card that MOUNTS as the active one was just added (or re-opened from
  // "done"): play the enter animation once and bring it into view. Captured at
  // mount so it never replays when the active exercise changes later.
  const [isFreshlyActive] = React.useState(isActive);
  React.useEffect(() => {
    if (isFreshlyActive) {
      cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isFreshlyActive]);

  // Effective load per set for a bodyweight exercise: saved body weight +
  // the extra KG picked for the set (0 = bodyweight only).
  const effectiveLoads =
    exercise.usesBodyweight && bodyWeight !== null
      ? exercise.sets.flatMap((set) => {
          const extra = set.weight.trim() === "" ? 0 : Number(set.weight);
          if (!Number.isFinite(extra)) return [];
          const load = effectiveLoad({
            additionalWeight: extra,
            usesBodyweight: true,
            bodyWeight,
          });
          return load === null ? [] : [formatCount(load, locale)];
        })
      : [];

  // The arm hint only matters while some set still needs one.
  const needsHandHint = exercise.isOneHanded && exercise.sets.some((set) => set.hand === null);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative gap-4 overflow-hidden rounded-2xl p-4 pl-5 shadow-none transition-colors duration-200 sm:p-5 sm:pl-6",
        isActive && "border-primary/30",
        isFreshlyActive &&
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", accent.bar)}
      />

      <div className="flex items-start gap-3">
        <CategoryTile category={category} />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate text-base leading-tight font-semibold text-foreground">
              {exercise.exerciseName}
            </h3>
            {isActive && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wider text-primary uppercase motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-200">
                <Circle
                  className="h-2 w-2 animate-pulse fill-current motion-reduce:animate-none"
                  aria-hidden="true"
                />
                {t.workout.nowBadge}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {category && (
              <span className="text-xs text-muted-foreground">
                {translateCategory(category, t)}
              </span>
            )}
            {exercise.isOneHanded && (
              <StatusBadge icon={ArrowLeftRight}>{t.workout.oneHandedBadge}</StatusBadge>
            )}
            {exercise.usesBodyweight && (
              <StatusBadge icon={PersonStanding}>{t.workout.bodyWeight.label}</StatusBadge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t.common.actionsFor(exercise.exerciseName)}
              className="-mt-1.5 -mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent/70"
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

      {lastTime && lastTime.sets.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {t.workout.lastTime}
          </span>
          {lastTime.sets.map((set, index) => (
            <span key={index} className="tabular-nums">
              <span aria-hidden="true">· </span>
              {`${formatCount(set.weight, locale)} ${t.records.units.kg} × ${formatCount(set.reps, locale)}${
                exercise.isOneHanded && set.hand ? ` · ${t.workout.hand[set.hand]}` : ""
              }`}
            </span>
          ))}
          {lastTime.usesBodyweight && (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true">· </span>
              <PersonStanding className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
              {t.workout.bodyWeight.label}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-1">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <label
            htmlFor={`bodyweight-${exercise.exerciseId}`}
            className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 text-sm text-foreground"
          >
            <PersonStanding
              className="h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {t.workout.bodyweightExercise.label}
          </label>
          <Switch
            id={`bodyweight-${exercise.exerciseId}`}
            checked={exercise.usesBodyweight}
            onCheckedChange={onChangeUsesBodyweight}
            disabled={disabled}
            aria-label={t.workout.bodyweightExercise.label}
          />
        </div>
        {exercise.usesBodyweight && (
          <p className="pb-2 text-xs text-muted-foreground">
            {bodyWeight === null
              ? t.workout.bodyweightExercise.noBodyWeight
              : `${t.workout.bodyweightExercise.current(
                  `${formatCount(bodyWeight, locale)} ${t.records.units.kg}`,
                )} · ${t.workout.bodyweightExercise.hint}`}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {needsHandHint && (
          <p className="text-xs text-muted-foreground">{t.workout.oneHandedHint}</p>
        )}

        {hasSets && (
          <div className={`grid items-end border-b border-border/60 pb-2 ${setGridClass(exercise.isOneHanded)}`}>
            <span className={HEADER_CELL}>{t.workout.setsHeader.number}</span>
            <span className={cn(HEADER_CELL, "text-center")}>
              {exercise.usesBodyweight
                ? t.workout.bodyweightExercise.extraHeader
                : t.workout.setsHeader.weight}
            </span>
            <span className={cn(HEADER_CELL, "text-center")}>{t.workout.setsHeader.reps}</span>
            {exercise.isOneHanded && (
              <span className={cn(HEADER_CELL, "text-center")}>{t.workout.hand.label}</span>
            )}
            <span className={cn(HEADER_CELL, "text-center")}>{t.workout.setsHeader.hard}</span>
            <span aria-hidden="true" />
          </div>
        )}

        {effectiveLoads.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t.workout.bodyweightExercise.effectiveLoad(
              `${effectiveLoads.join(", ")} ${t.records.units.kg}`,
            )}
          </p>
        )}

        {hasSets ? (
          exercise.sets.map((set, index) => (
            <WorkoutSetRow
              key={set.id}
              set={set}
              setNumber={index + 1}
              isFirst={index === 0}
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
          <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            {t.workout.noSetsYet}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Neutral, dashed: the frequent "log another set" action. */}
        <Button
          type="button"
          variant="outline"
          onClick={onAddSet}
          className="h-12 w-full rounded-xl border-dashed text-sm transition-[transform,background-color,border-color] duration-150 active:scale-[0.98] sm:h-11 sm:w-auto"
        >
          <Plus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
          {t.workout.addSet}
        </Button>

        {/* Soft accent tint (not solid, not red): a natural "finish" action. */}
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          loading={isSavingDone}
          disabled={disabled}
          className="h-12 w-full rounded-xl border border-primary/30 bg-primary/10 text-sm text-primary transition-[transform,background-color,border-color] duration-150 hover:border-primary/40 hover:bg-primary/15 hover:text-primary active:scale-[0.98] sm:h-11 sm:w-auto"
        >
          {!isSavingDone && <CheckCircle2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />}
          {t.workout.doneWithExercise}
        </Button>
      </div>
    </Card>
  );
}
