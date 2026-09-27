"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExerciseProgressChart } from "@/components/progress/exercise-progress-chart";
import { getExerciseProgress } from "@/lib/progress/analytics";
import type { Exercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types/workout";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatVolume } from "@/lib/i18n/format";

interface ExerciseProgressProps {
  workouts: Workout[];
  exercises: Exercise[];
  selectedExerciseId: string;
  onSelectExercise: (exerciseId: string) => void;
}

export function ExerciseProgress({
  workouts,
  exercises,
  selectedExerciseId,
  onSelectExercise,
}: ExerciseProgressProps) {
  const t = useTranslations();
  const locale = useLocale();
  const progress = React.useMemo(
    () => getExerciseProgress(workouts, selectedExerciseId),
    [workouts, selectedExerciseId],
  );

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.progress.exerciseProgress.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground" htmlFor="exercise-progress-select">
            {t.progress.exerciseProgress.exerciseLabel}
          </label>
          <Select value={selectedExerciseId} onValueChange={onSelectExercise}>
            <SelectTrigger id="exercise-progress-select" className="sm:w-72">
              <SelectValue placeholder={t.progress.exerciseProgress.selectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {progress.sessions === 0 ? (
          <p className="text-sm text-muted-foreground">
            {selectedExercise
              ? t.progress.exerciseProgress.neverUsed(selectedExercise.name)
              : t.progress.exerciseProgress.selectPrompt}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label={t.progress.exerciseProgress.statBestWeight}
                value={`${formatCount(progress.bestWeight ?? 0, locale)} kg`}
              />
              <Stat
                label={t.progress.exerciseProgress.statBestReps}
                value={formatCount(progress.bestReps ?? 0, locale)}
              />
              <Stat
                label={t.progress.exerciseProgress.statTotalVolume}
                value={formatVolume(progress.totalVolume, locale)}
              />
              <Stat
                label={t.progress.exerciseProgress.statSessions}
                value={formatCount(progress.sessions, locale)}
              />
            </div>

            {progress.sessions === 1 && (
              <p className="text-sm text-muted-foreground">
                {t.progress.exerciseProgress.needMoreSessions}
              </p>
            )}

            <ExerciseProgressChart data={progress.maxWeightSeries} />

            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <h4 className="mb-3 text-sm font-medium text-foreground">
                {t.progress.exerciseProgress.personalRecordsTitle}
              </h4>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <RecordItem
                  label={t.progress.exerciseProgress.recordBestWeight}
                  value={`${formatCount(progress.bestWeight ?? 0, locale)} kg`}
                />
                <RecordItem
                  label={t.progress.exerciseProgress.recordBestReps}
                  value={formatCount(progress.bestReps ?? 0, locale)}
                />
                <RecordItem
                  label={t.progress.exerciseProgress.recordBestSetVolume}
                  value={formatVolume(progress.bestSetVolume ?? 0, locale)}
                />
              </dl>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}

function RecordItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
