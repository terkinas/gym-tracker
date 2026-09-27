// Pure calculation layer for the `/progress` dashboard. Nothing here touches
// storage or the filesystem — it only derives metrics from the workouts and
// exercises arrays it's given — so it's safe to import from both the server
// page (which loads the data once) and the client dashboard (which re-derives
// filtered views as the user changes the time range or selected exercise,
// without a round trip back to the server).

import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import type { Exercise, ExerciseCategory } from "@/lib/exercises";
import { getTodayDateString } from "@/lib/date";
import type { Workout } from "@/lib/types/workout";

export type TimeRange = "7" | "30" | "90" | "all";

// Labels are resolved from the translation dictionary at render time (see
// `t.progress.timeRanges[value]`) rather than hard-coded here — this array
// only fixes the display order and the set of selectable values.
export const TIME_RANGE_VALUES: TimeRange[] = ["7", "30", "90", "all"];

export type DailyPoint = { date: string; value: number };

export type ProgressSummary = {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  totalExercises: number;
  lastWorkoutDate: string | null;
  workoutsThisWeek: number;
};

export type CategoryProgress = {
  category: ExerciseCategory;
  exerciseCount: number;
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
  volumeSeries: DailyPoint[];
};

export type ExerciseProgress = {
  exerciseId: string;
  sessions: number;
  bestWeight: number | null;
  bestReps: number | null;
  bestSetVolume: number | null;
  totalVolume: number;
  maxWeightSeries: DailyPoint[];
};

function setVolume(weight: number, reps: number): number {
  return weight * reps;
}

function workoutTotalVolume(workout: Workout): number {
  let total = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      total += setVolume(set.weight, set.reps);
    }
  }
  return total;
}

function workoutSetCount(workout: Workout): number {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

function sortByDateAsc(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Adds (or subtracts, for negative `days`) whole days to a `YYYY-MM-DD`
 * string. Anchored to UTC noon-free midnight parsing so it's stable
 * regardless of the timezone the code happens to run in (server or
 * browser) — only the string arithmetic matters here, not wall-clock time. */
function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday of the week containing `dateString`, as `YYYY-MM-DD`. */
function startOfWeek(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

const RANGE_DAYS: Record<Exclude<TimeRange, "all">, number> = {
  "7": 7,
  "30": 30,
  "90": 90,
};

/** Keeps only workouts within the selected trailing window ending today.
 * `range: "all"` returns every workout untouched. */
export function filterWorkoutsByRange(workouts: Workout[], range: TimeRange): Workout[] {
  if (range === "all") return workouts;
  const cutoff = addDaysToDateString(getTodayDateString(), -(RANGE_DAYS[range] - 1));
  return workouts.filter((workout) => workout.date >= cutoff);
}

/** All-time top-line stats — deliberately not affected by the chart time
 * range, since "how many workouts have I ever logged" shouldn't change when
 * someone switches the chart window. */
export function getProgressSummary(
  workouts: Workout[],
  exercises: Exercise[],
): ProgressSummary {
  const sorted = sortByDateAsc(workouts);
  const totalSets = workouts.reduce((sum, workout) => sum + workoutSetCount(workout), 0);
  const totalVolume = workouts.reduce((sum, workout) => sum + workoutTotalVolume(workout), 0);
  const lastWorkoutDate = sorted.length > 0 ? sorted[sorted.length - 1].date : null;
  const weekStart = startOfWeek(getTodayDateString());
  const workoutsThisWeek = workouts.filter((workout) => workout.date >= weekStart).length;

  return {
    totalWorkouts: workouts.length,
    totalSets,
    totalVolume,
    totalExercises: exercises.length,
    lastWorkoutDate,
    workoutsThisWeek,
  };
}

/** One point per workout day within range, valued by sets performed that
 * day. A user can only ever log one workout per date, so a plain workout
 * count would just be a flat line of 1s — sets performed is the honest,
 * still-real measure of that day's training activity. */
export function getTrainingActivity(workouts: Workout[], range: TimeRange): DailyPoint[] {
  const filtered = filterWorkoutsByRange(workouts, range);
  return sortByDateAsc(filtered).map((workout) => ({
    date: workout.date,
    value: workoutSetCount(workout),
  }));
}

export function getVolumeProgression(workouts: Workout[], range: TimeRange): DailyPoint[] {
  const filtered = filterWorkoutsByRange(workouts, range);
  return sortByDateAsc(filtered).map((workout) => ({
    date: workout.date,
    value: workoutTotalVolume(workout),
  }));
}

/** Per-category stats within the selected time range, in the fixed category
 * order the app always displays. `exerciseCount` is the one field that is
 * intentionally NOT range-limited — it's a static fact about the user's
 * exercise list, not something that changes as training history is
 * filtered. */
export function getCategoryProgress(
  workouts: Workout[],
  exercises: Exercise[],
  range: TimeRange,
): CategoryProgress[] {
  const filtered = sortByDateAsc(filterWorkoutsByRange(workouts, range));

  return EXERCISE_CATEGORIES.map((category) => {
    const categoryExerciseIds = new Set(
      exercises.filter((exercise) => exercise.category === category).map((exercise) => exercise.id),
    );

    let workoutCount = 0;
    let totalSets = 0;
    let totalVolume = 0;
    const volumeSeries: DailyPoint[] = [];

    for (const workout of filtered) {
      let dayVolume = 0;
      let matchedThisWorkout = false;

      for (const exercise of workout.exercises) {
        if (!categoryExerciseIds.has(exercise.exerciseId)) continue;
        matchedThisWorkout = true;

        for (const set of exercise.sets) {
          totalSets += 1;
          const volume = setVolume(set.weight, set.reps);
          totalVolume += volume;
          dayVolume += volume;
        }
      }

      if (matchedThisWorkout) {
        workoutCount += 1;
        volumeSeries.push({ date: workout.date, value: dayVolume });
      }
    }

    return {
      category,
      exerciseCount: categoryExerciseIds.size,
      workoutCount,
      totalSets,
      totalVolume,
      volumeSeries,
    };
  });
}

/** Stats and history for a single exercise, always across the user's full
 * workout history — "best weight ever recorded" shouldn't reset just
 * because the dashboard's chart range is set to 7 days. */
export function getExerciseProgress(workouts: Workout[], exerciseId: string): ExerciseProgress {
  const sorted = sortByDateAsc(workouts);

  let sessions = 0;
  let bestWeight: number | null = null;
  let bestReps: number | null = null;
  let bestSetVolume: number | null = null;
  let totalVolume = 0;
  const maxWeightSeries: DailyPoint[] = [];

  for (const workout of sorted) {
    const match = workout.exercises.find((exercise) => exercise.exerciseId === exerciseId);
    if (!match || match.sets.length === 0) continue;

    sessions += 1;
    let sessionMaxWeight = 0;

    for (const set of match.sets) {
      const volume = setVolume(set.weight, set.reps);
      totalVolume += volume;
      if (bestWeight === null || set.weight > bestWeight) bestWeight = set.weight;
      if (bestReps === null || set.reps > bestReps) bestReps = set.reps;
      if (bestSetVolume === null || volume > bestSetVolume) bestSetVolume = volume;
      if (set.weight > sessionMaxWeight) sessionMaxWeight = set.weight;
    }

    maxWeightSeries.push({ date: workout.date, value: sessionMaxWeight });
  }

  return {
    exerciseId,
    sessions,
    bestWeight,
    bestReps,
    bestSetVolume,
    totalVolume,
    maxWeightSeries,
  };
}
