"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressSummary } from "@/components/progress/progress-summary";
import { TimeRangeSelect } from "@/components/progress/time-range-select";
import { TrainingActivityChart } from "@/components/progress/training-activity-chart";
import { VolumeChart } from "@/components/progress/volume-chart";
import { CategoryProgressList } from "@/components/progress/category-progress";
import { ExerciseProgress } from "@/components/progress/exercise-progress";
import {
  getCategoryProgress,
  getExerciseProgress,
  getProgressSummary,
  getTrainingActivity,
  getVolumeProgression,
} from "@/lib/progress/analytics";
import type { TimeRange } from "@/lib/progress/analytics";
import type { Exercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types/workout";
import { useTranslations } from "@/lib/i18n/locale-context";
import type { Dictionary } from "@/lib/i18n/translations";

interface ProgressDashboardProps {
  workouts: Workout[];
  exercises: Exercise[];
}

/** Default exercise for the exercise-progress picker: whichever the user
 * has actually logged the most, so the section shows real data on first
 * load instead of an arbitrary, possibly-never-used exercise. */
function pickDefaultExerciseId(workouts: Workout[], exercises: Exercise[]): string | null {
  if (exercises.length === 0) return null;

  let bestId = exercises[0].id;
  let bestSessions = -1;

  for (const exercise of exercises) {
    const sessions = getExerciseProgress(workouts, exercise.id).sessions;
    if (sessions > bestSessions) {
      bestSessions = sessions;
      bestId = exercise.id;
    }
  }

  return bestId;
}

export function ProgressDashboard({ workouts, exercises }: ProgressDashboardProps) {
  const t = useTranslations();
  const [range, setRange] = React.useState<TimeRange>("30");
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string | null>(() =>
    pickDefaultExerciseId(workouts, exercises),
  );

  const summary = React.useMemo(
    () => getProgressSummary(workouts, exercises),
    [workouts, exercises],
  );
  const activity = React.useMemo(() => getTrainingActivity(workouts, range), [workouts, range]);
  const volumeSeries = React.useMemo(
    () => getVolumeProgression(workouts, range),
    [workouts, range],
  );
  const categories = React.useMemo(
    () => getCategoryProgress(workouts, exercises, range),
    [workouts, exercises, range],
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader t={t} />

      {workouts.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <>
          <ProgressSummary summary={summary} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {t.progress.charts.sectionTitle}
              </h2>
              <TimeRangeSelect value={range} onChange={setRange} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t.progress.charts.trainingActivityTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrainingActivityChart data={activity} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t.progress.charts.volumeProgressTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VolumeChart data={volumeSeries} />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t.progress.categoriesSection.title}
            </h2>
            <CategoryProgressList categories={categories} />
          </div>

          {selectedExerciseId && (
            <ExerciseProgress
              workouts={workouts}
              exercises={exercises}
              selectedExerciseId={selectedExerciseId}
              onSelectExercise={setSelectedExerciseId}
            />
          )}
        </>
      )}
    </div>
  );
}

function PageHeader({ t }: { t: Dictionary }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t.progress.pageTitle}
      </h1>
      <p className="text-sm text-muted-foreground sm:text-base">
        {t.progress.pageSubtitle}
      </p>
    </div>
  );
}

function EmptyState({ t }: { t: Dictionary }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border px-5 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <TrendingUp className="h-7 w-7" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t.progress.emptyState.title}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t.progress.emptyState.description}
        </p>
      </div>
      <Button asChild>
        <Link href="/treniruote">{t.progress.emptyState.cta}</Link>
      </Button>
    </div>
  );
}
