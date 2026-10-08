"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, Dumbbell, Layers3, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Achievements } from "@/components/progress/achievements";
import { CategoryProgressList } from "@/components/progress/category-progress";
import { ExerciseProgress } from "@/components/progress/exercise-progress";
import { OverallProgress } from "@/components/progress/overall-progress";
import { ProgressSummary } from "@/components/progress/progress-summary";
import { RecentRecords } from "@/components/progress/recent-records";
import { TimeRangeSelect } from "@/components/progress/time-range-select";
import { TrainingActivityChart } from "@/components/progress/training-activity-chart";
import { WeeklyVolume } from "@/components/progress/weekly-volume";
import {
  calculatePRProgress,
  filterWorkoutsByRange,
  getCategoryProgress,
  getExerciseProgress,
  getProgressSummary,
  getTrainingActivity,
} from "@/lib/progress/analytics";
import type { ProgressOverview, ScorePeriod, TimeRange } from "@/lib/progress/analytics";
import type { Exercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types/workout";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatDate, pluralize } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/translations";

interface ProgressDashboardProps {
  workouts: Workout[];
  exercises: Exercise[];
  /** Score, streaks and achievements, computed server-side with the same
   * functions the leaderboard uses. */
  overview: ProgressOverview;
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

export function ProgressDashboard({ workouts, exercises, overview }: ProgressDashboardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [range, setRange] = React.useState<TimeRange>("30");
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string | null>(() =>
    pickDefaultExerciseId(workouts, exercises),
  );

  const summary = React.useMemo(
    () => getProgressSummary(workouts, exercises),
    [workouts, exercises],
  );
  const activity = React.useMemo(() => getTrainingActivity(workouts, range), [workouts, range]);
  const categories = React.useMemo(
    () => getCategoryProgress(workouts, exercises, range),
    [workouts, exercises, range],
  );

  // The Progress Score only exists for 7/30/90 days. "All time" shows the
  // 90-day score and says so; the KPI numbers below do follow "All time".
  const scorePeriod: ScorePeriod = range === "all" ? "90" : range;
  const score = overview.scores[scorePeriod];

  const kpis = React.useMemo(() => {
    const inRange = filterWorkoutsByRange(workouts, range);
    const trained = new Set<string>();
    for (const workout of inRange) {
      for (const entry of workout.exercises) {
        if (entry.sets.length > 0) trained.add(entry.exerciseId);
      }
    }
    if (range === "all") {
      return {
        workouts: summary.totalWorkouts,
        sets: summary.totalSets,
        prs: calculatePRProgress(workouts).count,
        exercises: trained.size,
      };
    }
    return {
      workouts: overview.scores[range].workouts,
      sets: overview.scores[range].sets,
      prs: overview.scores[range].prs,
      exercises: trained.size,
    };
  }, [workouts, range, summary, overview]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{t.progress.timeRanges[range]}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t.progress.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.progress.pageSubtitle}</p>
          {workouts.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              {summary.lastWorkoutDate && (
                <span>
                  {t.progress.ui.lastWorkout}:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(summary.lastWorkoutDate, locale)}
                  </span>
                </span>
              )}
              <span>
                {t.progress.ui.thisWeek}:{" "}
                <span className="font-medium text-foreground">
                  {formatCount(summary.workoutsThisWeek, locale)}{" "}
                  {pluralize(locale, summary.workoutsThisWeek, t.progress.words.workout)}
                </span>
              </span>
            </p>
          )}
        </div>
        {workouts.length > 0 && <TimeRangeSelect value={range} onChange={setRange} />}
      </header>

      {workouts.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <>
          <OverallProgress score={score} isFallbackPeriod={range === "all"} />

          <ProgressSummary kpis={kpis} streak={overview.streak} />

          <RecentRecords workouts={workouts} exercises={exercises} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              icon={CalendarDays}
              title={t.progress.charts.trainingActivityTitle}
              subtitle={t.progress.ui.activity.subtitle}
            >
              <TrainingActivityChart data={activity} />
            </ChartCard>

            <ChartCard
              icon={BarChart3}
              title={t.progress.weeklyVolume.title}
              subtitle={t.progress.weeklyVolume.subtitle}
            >
              <WeeklyVolume workouts={workouts} exercises={exercises} />
            </ChartCard>
          </div>

          {selectedExerciseId && (
            <ExerciseProgress
              workouts={workouts}
              exercises={exercises}
              selectedExerciseId={selectedExerciseId}
              onSelectExercise={setSelectedExerciseId}
              range={range}
            />
          )}

          <section className="flex flex-col gap-3" aria-labelledby="categories-title">
            <h2 id="categories-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              <Layers3 className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              {t.progress.categoriesSection.title}
            </h2>
            <CategoryProgressList categories={categories} />
          </section>

          <Achievements achievements={overview.achievements} />
        </>
      )}
    </div>
  );
}

function ChartCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground"
        >
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ t }: { t: Dictionary }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border px-5 py-16 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground"
      >
        <TrendingUp className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t.progress.emptyState.title}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t.progress.emptyState.description}
        </p>
      </div>
      <Link
        href="/treniruote"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input px-5 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Dumbbell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        {t.progress.emptyState.cta}
      </Link>
    </div>
  );
}
