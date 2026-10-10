"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, Dumbbell, Search, Trophy } from "lucide-react";

import { ExerciseProgressChart } from "@/components/progress/exercise-progress-chart";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/progress/section-heading";
import { CategoryTile } from "@/components/workout/workout-ui";
import { filterWorkoutsByRange, getExerciseProgress } from "@/lib/progress/analytics";
import type { TimeRange } from "@/lib/progress/analytics";
import type { Exercise } from "@/lib/exercises";
import type { AnalyticsWorkout } from "@/lib/types/workout";
import { translateCategory } from "@/lib/i18n/categories";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatVolume } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

interface ExerciseProgressProps {
  workouts: AnalyticsWorkout[];
  exercises: Exercise[];
  selectedExerciseId: string;
  onSelectExercise: (exerciseId: string) => void;
  /** Same period as the rest of the page; it only limits the chart. */
  range: TimeRange;
}

export function ExerciseProgress({
  workouts,
  exercises,
  selectedExerciseId,
  onSelectExercise,
  range,
}: ExerciseProgressProps) {
  const t = useTranslations();
  const locale = useLocale();
  const ui = t.progress.ui.exercise;
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Stats are always from the user's full history (a record is a record); only
  // the chart follows the selected period.
  const progress = React.useMemo(
    () => getExerciseProgress(workouts, selectedExerciseId),
    [workouts, selectedExerciseId],
  );
  const chartSeries = React.useMemo(
    () => getExerciseProgress(filterWorkoutsByRange(workouts, range), selectedExerciseId).maxWeightSeries,
    [workouts, range, selectedExerciseId],
  );

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    if (!q) return exercises;
    return exercises.filter(
      (exercise) =>
        exercise.name.toLocaleLowerCase(locale).includes(q) ||
        translateCategory(exercise.category, t).toLocaleLowerCase(locale).includes(q),
    );
  }, [exercises, query, locale, t]);

  function choose(id: string) {
    onSelectExercise(id);
    setPickerOpen(false);
    setQuery("");
  }

  return (
    <section
      aria-labelledby="exercise-progress-title"
      className="flex flex-col gap-4 rounded-none border border-border bg-surface p-4 sm:p-5"
    >
      <SectionHeading
        id="exercise-progress-title"
        icon={Dumbbell}
        tone="blue"
        title={t.progress.exerciseProgress.title}
        subtitle={ui.subtitle}
      />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          aria-expanded={pickerOpen}
          aria-controls="exercise-picker-panel"
          onClick={() => setPickerOpen((open) => !open)}
          className="flex min-h-14 w-full items-center gap-3 rounded-none border border-input bg-muted/20 px-3 text-left transition-colors duration-150 outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CategoryTile category={selectedExercise?.category} className="h-9 w-9" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {selectedExercise?.name ?? t.progress.exerciseProgress.selectPlaceholder}
            </span>
            {selectedExercise && (
              <span className="text-xs text-muted-foreground">
                {translateCategory(selectedExercise.category, t)}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200",
              pickerOpen && "rotate-180",
            )}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>

        {pickerOpen && (
          <div
            id="exercise-picker-panel"
            className="flex flex-col gap-2 rounded-none border border-border bg-popover p-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <Input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={ui.searchPlaceholder}
                aria-label={ui.searchPlaceholder}
                className="h-11 pl-9"
              />
            </div>
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">{ui.noResults}</li>
              ) : (
                filtered.map((exercise) => {
                  const isSelected = exercise.id === selectedExerciseId;
                  return (
                    <li key={exercise.id}>
                      <button
                        type="button"
                        onClick={() => choose(exercise.id)}
                        aria-current={isSelected ? "true" : undefined}
                        className={cn(
                          "flex min-h-12 w-full items-center gap-3 rounded-none px-2 py-1.5 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected ? "bg-primary/10" : "hover:bg-accent",
                        )}
                      >
                        <CategoryTile category={exercise.category} className="h-8 w-8 rounded-none" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-foreground">{exercise.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {translateCategory(exercise.category, t)}
                          </span>
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {progress.sessions === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-none border border-dashed border-border px-4 py-8 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            {selectedExercise
              ? t.progress.exerciseProgress.neverUsed(selectedExercise.name)
              : t.progress.exerciseProgress.selectPrompt}
          </p>
          <Link
            href="/treniruote"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-none border border-input px-4 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Dumbbell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {t.progress.ui.noScoreCta}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <Stat
              highlight
              label={t.progress.exerciseProgress.statBestWeight}
              hint={ui.bestWeightHint}
              value={`${formatCount(progress.bestWeight ?? 0, locale)} kg`}
            />
            <Stat
              label={t.progress.exerciseProgress.statBestReps}
              hint={ui.bestRepsHint}
              value={formatCount(progress.bestReps ?? 0, locale)}
            />
            <Stat
              label={ui.statSetVolume}
              hint={ui.setVolumeHint}
              value={`${formatVolume(progress.bestSetVolume ?? 0, locale)} kg`}
            />
            <Stat
              label={t.progress.exerciseProgress.statHardSets}
              hint={ui.hardSetsHint}
              value={formatCount(progress.hardSets, locale)}
            />
            <Stat
              label={t.progress.exerciseProgress.statSessions}
              hint={ui.sessionsHint}
              value={formatCount(progress.sessions, locale)}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          {progress.sessions === 1 && (
            <p className="text-sm text-muted-foreground">
              {t.progress.exerciseProgress.needMoreSessions}
            </p>
          )}

          <div className="flex flex-col gap-3 rounded-none border border-border/60 bg-muted/10 p-3 sm:p-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span aria-hidden="true" className="h-2 w-2 rounded-none bg-gradient-to-br from-emerald-400 to-cyan-400" />
                {ui.chartTitle}
              </h3>
              <p className="text-xs text-muted-foreground">{ui.chartSubtitle}</p>
            </div>
            <ExerciseProgressChart data={chartSeries} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{ui.allTimeNote}</p>
            <Link
              href="/rekordai"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-none border border-input px-4 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trophy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {ui.viewRecords}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({
  label,
  hint,
  value,
  highlight = false,
  className,
}: {
  label: string;
  hint: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-none border px-3.5 py-3",
        highlight
          ? "border-emerald-400/30 bg-gradient-to-br from-emerald-400/20 to-cyan-400/5"
          : "border-border/60 bg-muted/20",
        className,
      )}
    >
      <span className={cn("truncate text-xs font-medium", highlight ? "text-emerald-300" : "text-muted-foreground")}>
        {label}
      </span>
      <span className="text-2xl leading-none font-bold break-words text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}
