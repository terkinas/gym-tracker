// Pure calculation layer for the `/progress` dashboard. Nothing here touches
// storage or the filesystem — it only derives metrics from the workouts and
// exercises arrays it's given — so it's safe to import from both the server
// page (which loads the data once) and the client dashboard (which re-derives
// filtered views as the user changes the time range or selected exercise,
// without a round trip back to the server).

import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import type { Exercise, ExerciseCategory } from "@/lib/exercises";
import { getTodayDateString } from "@/lib/date";
import type { AnalyticsWorkout } from "@/lib/types/workout";

export type TimeRange = "7" | "30" | "90" | "all";

// Labels are resolved from the translation dictionary at render time (see
// `t.progress.timeRanges[value]`) rather than hard-coded here — this array
// only fixes the display order and the set of selectable values.
export const TIME_RANGE_VALUES: TimeRange[] = ["7", "30", "90", "all"];

export type DailyPoint = { date: string; value: number };

export type ProgressSummary = {
  totalWorkouts: number;
  totalSets: number;
  /** Sets flagged as "hard sets" (the app's volume measure). */
  totalHardSets: number;
  totalExercises: number;
  lastWorkoutDate: string | null;
  workoutsThisWeek: number;
};

export type CategoryProgress = {
  category: ExerciseCategory;
  exerciseCount: number;
  workoutCount: number;
  totalSets: number;
  /** Direct hard sets (exercises whose primary muscle is this category). */
  hardSets: number;
  hardSetSeries: DailyPoint[];
};

export type ExerciseProgress = {
  exerciseId: string;
  sessions: number;
  bestWeight: number | null;
  bestReps: number | null;
  bestSetVolume: number | null;
  hardSets: number;
  maxWeightSeries: DailyPoint[];
};

export function setVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function workoutHardSetCount(workout: AnalyticsWorkout): number {
  let total = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.isHardSet) total += 1;
    }
  }
  return total;
}

export function workoutSetCount(workout: AnalyticsWorkout): number {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

function sortByDateAsc(workouts: AnalyticsWorkout[]): AnalyticsWorkout[] {
  return [...workouts].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Adds (or subtracts, for negative `days`) whole days to a `YYYY-MM-DD`
 * string. Anchored to UTC noon-free midnight parsing so it's stable
 * regardless of the timezone the code happens to run in (server or
 * browser) — only the string arithmetic matters here, not wall-clock time. */
export function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday of the week containing `dateString`, as `YYYY-MM-DD`. */
export function startOfWeek(dateString: string): string {
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
export function filterWorkoutsByRange(workouts: AnalyticsWorkout[], range: TimeRange): AnalyticsWorkout[] {
  if (range === "all") return workouts;
  const cutoff = addDaysToDateString(getTodayDateString(), -(RANGE_DAYS[range] - 1));
  return workouts.filter((workout) => workout.date >= cutoff);
}

/** All-time top-line stats — deliberately not affected by the chart time
 * range, since "how many workouts have I ever logged" shouldn't change when
 * someone switches the chart window. */
export function getProgressSummary(
  workouts: AnalyticsWorkout[],
  exercises: Exercise[],
): ProgressSummary {
  const sorted = sortByDateAsc(workouts);
  const totalSets = workouts.reduce((sum, workout) => sum + workoutSetCount(workout), 0);
  const totalHardSets = workouts.reduce((sum, workout) => sum + workoutHardSetCount(workout), 0);
  const lastWorkoutDate = sorted.length > 0 ? sorted[sorted.length - 1].date : null;
  const weekStart = startOfWeek(getTodayDateString());
  const workoutsThisWeek = workouts.filter((workout) => workout.date >= weekStart).length;

  return {
    totalWorkouts: workouts.length,
    totalSets,
    totalHardSets,
    totalExercises: exercises.length,
    lastWorkoutDate,
    workoutsThisWeek,
  };
}

/** One point per workout day within range, valued by sets performed that
 * day. A user can only ever log one workout per date, so a plain workout
 * count would just be a flat line of 1s — sets performed is the honest,
 * still-real measure of that day's training activity. */
export function getTrainingActivity(workouts: AnalyticsWorkout[], range: TimeRange): DailyPoint[] {
  const filtered = filterWorkoutsByRange(workouts, range);
  return sortByDateAsc(filtered).map((workout) => ({
    date: workout.date,
    value: workoutSetCount(workout),
  }));
}

/** Per-category stats within the selected time range, in the fixed category
 * order the app always displays. `exerciseCount` is the one field that is
 * intentionally NOT range-limited — it's a static fact about the user's
 * exercise list, not something that changes as training history is
 * filtered. */
export function getCategoryProgress(
  workouts: AnalyticsWorkout[],
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
    let hardSets = 0;
    const hardSetSeries: DailyPoint[] = [];

    for (const workout of filtered) {
      let dayHardSets = 0;
      let matchedThisWorkout = false;

      for (const exercise of workout.exercises) {
        if (!categoryExerciseIds.has(exercise.exerciseId)) continue;
        matchedThisWorkout = true;

        for (const set of exercise.sets) {
          totalSets += 1;
          if (set.isHardSet) {
            hardSets += 1;
            dayHardSets += 1;
          }
        }
      }

      if (matchedThisWorkout) {
        workoutCount += 1;
        hardSetSeries.push({ date: workout.date, value: dayHardSets });
      }
    }

    return {
      category,
      exerciseCount: categoryExerciseIds.size,
      workoutCount,
      totalSets,
      hardSets,
      hardSetSeries,
    };
  });
}

/** Stats and history for a single exercise, always across the user's full
 * workout history — "best weight ever recorded" shouldn't reset just
 * because the dashboard's chart range is set to 7 days. */
export function getExerciseProgress(workouts: AnalyticsWorkout[], exerciseId: string): ExerciseProgress {
  const sorted = sortByDateAsc(workouts);

  let sessions = 0;
  let bestWeight: number | null = null;
  let bestReps: number | null = null;
  let bestSetVolume: number | null = null;
  let hardSets = 0;
  const maxWeightSeries: DailyPoint[] = [];

  for (const workout of sorted) {
    const match = workout.exercises.find((exercise) => exercise.exerciseId === exerciseId);
    if (!match || match.sets.length === 0) continue;

    sessions += 1;
    let sessionMaxWeight = 0;

    for (const set of match.sets) {
      const volume = setVolume(set.weight, set.reps);
      if (set.isHardSet) hardSets += 1;
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
    hardSets,
    maxWeightSeries,
  };
}

// ---------------------------------------------------------------------------
// Personal records (`/rekordai`)
// ---------------------------------------------------------------------------

export type PersonalRecord = {
  exerciseId: string;
  /** Heaviest weight used in any single set, and the first date it was
   * reached. */
  bestWeight: number;
  bestWeightDate: string;
  /** Most reps in any single set, and the first date it was reached. */
  bestReps: number;
  bestRepsDate: string;
  /** Best single set by weight × reps (NOT whole-workout volume). */
  bestSet: { weight: number; reps: number; volume: number; date: string };
};

/** Derives every exercise's records straight from the given workouts — no
 * stored/cached PR table, so deleting a workout or editing a set is
 * reflected automatically the next time this runs.
 *
 * Workouts are walked oldest → newest and a record only changes on a
 * STRICT improvement, so each date is the day the record was first set
 * (later ties don't move it). Exercises with no recorded sets are omitted.
 * Records are keyed by `exerciseId` and returned in first-seen order; the
 * caller decides which exercises to show (e.g. only ones that still exist).
 * Volume uses the shared `setVolume` helper. */
export function calculatePersonalRecords(workouts: AnalyticsWorkout[]): Map<string, PersonalRecord> {
  const records = new Map<string, PersonalRecord>();

  for (const workout of sortByDateAsc(workouts)) {
    for (const entry of workout.exercises) {
      for (const set of entry.sets) {
        const volume = setVolume(set.weight, set.reps);
        const current = records.get(entry.exerciseId);

        if (!current) {
          records.set(entry.exerciseId, {
            exerciseId: entry.exerciseId,
            bestWeight: set.weight,
            bestWeightDate: workout.date,
            bestReps: set.reps,
            bestRepsDate: workout.date,
            bestSet: { weight: set.weight, reps: set.reps, volume, date: workout.date },
          });
          continue;
        }

        if (set.weight > current.bestWeight) {
          current.bestWeight = set.weight;
          current.bestWeightDate = workout.date;
        }
        if (set.reps > current.bestReps) {
          current.bestReps = set.reps;
          current.bestRepsDate = workout.date;
        }
        if (volume > current.bestSet.volume) {
          current.bestSet = { weight: set.weight, reps: set.reps, volume, date: workout.date };
        }
      }
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Progress Score, streaks, achievements and the leaderboard ranking
// ---------------------------------------------------------------------------
//
// Everything below is pure (no storage access) and works on a minimal
// `ScoreWorkout` shape, so the SAME functions power `/progress` (one user's
// workouts) and `/leaderboard` (every ranked user's workouts) — the two pages
// can never disagree about a user's numbers.
//
// The Progress Score is a GymTracker "game" score. It is deliberately NOT a
// medical or scientific fitness rating, and it never compares absolute kg
// between users: strength is measured against the user's OWN earlier results.

/** Minimal workout shape the scoring functions need. A full `Workout` (or an
 * `AnalyticsWorkout`) fits. */
export type ScoreWorkout = {
  date: string;
  exercises: { exerciseId: string; sets: { weight: number; reps: number }[] }[];
};

export type ScorePeriod = "7" | "30" | "90";
export const SCORE_PERIOD_VALUES: ScorePeriod[] = ["7", "30", "90"];
export const DEFAULT_SCORE_PERIOD: ScorePeriod = "30";

export function parseScorePeriod(value: unknown): ScorePeriod {
  const raw = Array.isArray(value) ? value[0] : value;
  return SCORE_PERIOD_VALUES.includes(raw as ScorePeriod) ? (raw as ScorePeriod) : DEFAULT_SCORE_PERIOD;
}

export type ScoreComponentKey = "strength" | "consistency" | "prProgress" | "activity";

/** Nominal component weights — they always sum to 1 (100%). */
export const SCORE_WEIGHTS: Record<ScoreComponentKey, number> = {
  strength: 0.4,
  consistency: 0.3,
  prProgress: 0.2,
  activity: 0.1,
};
export const SCORE_COMPONENT_ORDER: ScoreComponentKey[] = [
  "strength",
  "consistency",
  "prProgress",
  "activity",
];
/** Scores are reported on a 0–1000 scale. */
export const MAX_SCORE = 1000;

// Per-period "full marks" targets. Each component saturates at its target, so
// doing far more than the target (a huge workout count, a flood of PRs) never
// buys unlimited score. Targets scale with the window length.
const PERIOD_TARGETS: Record<
  ScorePeriod,
  { workouts: number; sets: number; prs: number; strengthPct: number }
> = {
  "7": { workouts: 3, sets: 45, prs: 2, strengthPct: 0.04 },
  "30": { workouts: 12, sets: 180, prs: 6, strengthPct: 0.1 },
  "90": { workouts: 36, sets: 540, prs: 15, strengthPct: 0.18 },
};

// Strength-progress robustness knobs.
const E1RM_MAX_REPS = 12; // high-rep sets are treated as 12 reps (Epley is unreliable beyond that)
const MIN_BASELINE_SESSIONS = 2; // earlier sessions needed for a baseline
const SESSIONS_PER_ESTIMATE = 2; // baseline/current = mean of the best N sessions
const MAX_EXERCISE_GAIN = 0.3; // one exercise can't count for more than +30%…
const MAX_EXERCISE_LOSS = -0.25; // …or less than −25%
const FULL_CONFIDENCE_EXERCISES = 4; // exercises needed to fully trust the average

/** A workout counts only if it has at least one saved set. */
function isCountedWorkout(workout: ScoreWorkout): boolean {
  return workout.exercises.some((exercise) => exercise.sets.length > 0);
}

function countedSets(workout: ScoreWorkout): number {
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

function sortScoreWorkouts<T extends ScoreWorkout>(workouts: T[]): T[] {
  return [...workouts].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** First date (inclusive) of a trailing window ending `today`, matching
 * `filterWorkoutsByRange` (a 7-day window is today and the 6 days before). */
export function getScorePeriodStart(period: ScorePeriod, today: string = getTodayDateString()): string {
  return addDaysToDateString(today, -(RANGE_DAYS[period] - 1));
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`). */
function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Epley estimated one-rep max; reps are capped so a 30-rep set can't inflate it. */
function estimateOneRepMax(weight: number, reps: number): number {
  return weight * (1 + Math.min(reps, E1RM_MAX_REPS) / 30);
}

function meanOfTop(values: number[], count: number): number {
  const top = [...values].sort((a, b) => b - a).slice(0, count);
  return top.reduce((sum, value) => sum + value, 0) / top.length;
}

type StrengthSession = { date: string; value: number };

/** One representative value per exercise per workout: the best estimated 1RM
 * across that day's weighted sets. Using one value per session (not per set)
 * keeps a single odd set from dominating. */
function buildStrengthSessions(workouts: ScoreWorkout[]): Map<string, StrengthSession[]> {
  const sessions = new Map<string, StrengthSession[]>();

  for (const workout of sortScoreWorkouts(workouts)) {
    for (const entry of workout.exercises) {
      let best = 0;
      for (const set of entry.sets) {
        if (set.weight > 0 && set.reps >= 1) {
          best = Math.max(best, estimateOneRepMax(set.weight, set.reps));
        }
      }
      if (best <= 0) continue;
      const list = sessions.get(entry.exerciseId) ?? [];
      list.push({ date: workout.date, value: best });
      sessions.set(entry.exerciseId, list);
    }
  }

  return sessions;
}

export type StrengthProgress = {
  /** Exercises with enough history to be compared against themselves. */
  exerciseCount: number;
  /** Mean per-exercise change (each clamped), e.g. 0.184 = +18.4%. Shown to
   * the user. `null` when no exercise has enough history. */
  progressPct: number | null;
  /** 0..1 — how much the strength component is trusted. It scales the
   * component's WEIGHT in the score (0 = dropped, 1 = full 40%). */
  confidence: number;
  /** 0..1 strength component value (progress vs. the period's target). */
  value: number;
  available: boolean;
};

/** Compares each exercise with the user's OWN earlier results.
 *
 * - Baseline = mean of the best 2 sessions BEFORE the period (needs ≥ 2).
 * - Current  = mean of the best 2 sessions INSIDE the period.
 * - Brand-new exercises (fewer than 2 earlier sessions) use their own first
 *   two sessions as the baseline and the later in-period sessions as current,
 *   needing ≥ 4 sessions overall — so a new lifter can still show progress.
 * - Per-exercise change is clamped to [−25%, +30%]. Confidence grows with the
 *   number of qualifying exercises (full at 4+) and scales the component's
 *   weight in the score, so one huge jump on one lift can't dominate and the
 *   weight shrinks smoothly (no cliff) when history is thin. Exercises without
 *   enough history are skipped; if none qualify the component is unavailable
 *   and no progress is invented. */
export function calculateStrengthProgress(
  workouts: ScoreWorkout[],
  period: ScorePeriod,
  today: string = getTodayDateString(),
): StrengthProgress {
  const start = getScorePeriodStart(period, today);
  const sessionsByExercise = buildStrengthSessions(workouts.filter((w) => w.date <= today));
  const changes: number[] = [];

  for (const sessions of sessionsByExercise.values()) {
    const before = sessions.filter((s) => s.date < start);
    const inPeriod = sessions.filter((s) => s.date >= start);
    if (inPeriod.length === 0) continue;

    let baseline: number;
    let current: number;

    if (before.length >= MIN_BASELINE_SESSIONS) {
      baseline = meanOfTop(before.map((s) => s.value), SESSIONS_PER_ESTIMATE);
      current = meanOfTop(inPeriod.map((s) => s.value), SESSIONS_PER_ESTIMATE);
    } else {
      const firstTwo = sessions.slice(0, 2);
      const rest = sessions.slice(2).filter((s) => s.date >= start);
      if (sessions.length < 4 || rest.length < 2) continue;
      baseline = firstTwo.reduce((sum, s) => sum + s.value, 0) / firstTwo.length;
      current = meanOfTop(rest.map((s) => s.value), SESSIONS_PER_ESTIMATE);
    }

    if (baseline <= 0) continue;
    const change = (current - baseline) / baseline;
    changes.push(Math.min(MAX_EXERCISE_GAIN, Math.max(MAX_EXERCISE_LOSS, change)));
  }

  if (changes.length === 0) {
    return { exerciseCount: 0, progressPct: null, confidence: 0, value: 0, available: false };
  }

  const progressPct = changes.reduce((sum, c) => sum + c, 0) / changes.length;

  return {
    exerciseCount: changes.length,
    progressPct,
    confidence: Math.min(1, changes.length / FULL_CONFIDENCE_EXERCISES),
    value: clamp01(progressPct / PERIOD_TARGETS[period].strengthPct),
    available: true,
  };
}

/** Per-exercise cap on PRs that feed the SCORE (the displayed/achievement
 * count is uncapped) — a lifter who beats one lift every session can't farm
 * the PR component. */
export const MAX_SCORED_PRS_PER_EXERCISE = 2;

export type PRProgress = {
  /** Every new PR in the window — shown to the user, used for achievements. */
  count: number;
  /** PRs after the per-exercise cap — what feeds the score. */
  scored: number;
};

/** Counts new personal records (same three metrics as `/rekordai`: heaviest
 * weight, most reps, best weight × reps set) set on or after `fromDate`.
 *
 * Workouts are walked oldest → newest. A workout counts as ONE PR for an
 * exercise when it strictly beats that exercise's earlier bests in any metric
 * — three metrics improving on the same day is still one PR. The first time an
 * exercise is ever logged only sets the baseline (nothing to beat, so no PR). */
export function calculatePRProgress(workouts: ScoreWorkout[], fromDate: string = "0000-00-00"): PRProgress {
  const bests = new Map<string, { weight: number; reps: number; volume: number }>();
  const perExercise = new Map<string, number>();
  let count = 0;

  for (const workout of sortScoreWorkouts(workouts)) {
    for (const entry of workout.exercises) {
      if (entry.sets.length === 0) continue;

      let weight = 0;
      let reps = 0;
      let volume = 0;
      for (const set of entry.sets) {
        weight = Math.max(weight, set.weight);
        reps = Math.max(reps, set.reps);
        volume = Math.max(volume, setVolume(set.weight, set.reps));
      }

      const previous = bests.get(entry.exerciseId);
      if (previous) {
        const improved = weight > previous.weight || reps > previous.reps || volume > previous.volume;
        if (improved && workout.date >= fromDate) {
          count += 1;
          perExercise.set(entry.exerciseId, (perExercise.get(entry.exerciseId) ?? 0) + 1);
        }
        previous.weight = Math.max(previous.weight, weight);
        previous.reps = Math.max(previous.reps, reps);
        previous.volume = Math.max(previous.volume, volume);
      } else {
        bests.set(entry.exerciseId, { weight, reps, volume });
      }
    }
  }

  let scored = 0;
  for (const n of perExercise.values()) scored += Math.min(n, MAX_SCORED_PRS_PER_EXERCISE);
  return { count, scored };
}

export type ConsistencyResult = { workouts: number; activeWeeks: number; weekBuckets: number; value: number };

/** Normalised 0..1 consistency: half "how many workouts vs. a ~3/week target"
 * (saturating), half "in how many of the period's 7-day blocks did they train
 * at all" — so a burst of workouts in one week doesn't look like consistency. */
export function calculateConsistency(
  workouts: ScoreWorkout[],
  period: ScorePeriod,
  today: string = getTodayDateString(),
): ConsistencyResult {
  const start = getScorePeriodStart(period, today);
  const weekBuckets = Math.ceil(RANGE_DAYS[period] / 7);
  const inPeriod = workouts.filter((w) => isCountedWorkout(w) && w.date >= start && w.date <= today);

  const activeBlocks = new Set<number>();
  for (const workout of inPeriod) {
    activeBlocks.add(Math.floor(daysBetween(workout.date, today) / 7));
  }

  const frequency = clamp01(inPeriod.length / PERIOD_TARGETS[period].workouts);
  const regularity = clamp01(activeBlocks.size / weekBuckets);

  return {
    workouts: inPeriod.length,
    activeWeeks: activeBlocks.size,
    weekBuckets,
    value: 0.5 * frequency + 0.5 * regularity,
  };
}

/** A streak is counted in WORKOUT days, not calendar days: it continues while
 * consecutive workouts are at most this many days apart (≤ 3 rest days). */
export const STREAK_MAX_GAP_DAYS = 4;

export type StreakResult = { current: number; longest: number };

/** Workout-day streaks using the Europe/Vilnius dates already stored on each
 * workout. `current` is the run ending at the latest workout, and is 0 once
 * more than `STREAK_MAX_GAP_DAYS` days have passed since it. */
export function calculateStreak(workouts: ScoreWorkout[], today: string = getTodayDateString()): StreakResult {
  const dates = [...new Set(workouts.filter((w) => isCountedWorkout(w) && w.date <= today).map((w) => w.date))].sort();
  if (dates.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    run = daysBetween(dates[i - 1], dates[i]) <= STREAK_MAX_GAP_DAYS ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const alive = daysBetween(dates[dates.length - 1], today) <= STREAK_MAX_GAP_DAYS;
  return { current: alive ? run : 0, longest };
}

export type ProgressScore = {
  period: ScorePeriod;
  /** False when there are no saved workouts in the period — no score is made up. */
  hasData: boolean;
  /** 0–1000, rounded-none for display AND used for ranking, so the order always matches what's shown. */
  score: number;
  strength: StrengthProgress;
  /** Component fill, 0..1. `weightFactor` (0..1) scales the nominal weight:
   * 1 for every component except Strength, which fades in with its confidence. */
  components: Record<ScoreComponentKey, { value: number; available: boolean; weightFactor: number }>;
  workouts: number;
  sets: number;
  prs: number;
};

/** Deterministic Progress Score for one user over a trailing period.
 *
 * score = 1000 × Σ(weight × component) / Σ(weights of available components)
 *
 * Strength 40% · Consistency 30% · PR progress 20% · Activity 10%. Strength's
 * weight is scaled by its confidence (thin history → smaller weight, none →
 * dropped) and the weights are renormalised, instead of faking progress. */
export function calculateProgressScore(
  workouts: ScoreWorkout[],
  period: ScorePeriod,
  today: string = getTodayDateString(),
): ProgressScore {
  const start = getScorePeriodStart(period, today);
  const inPeriod = workouts.filter((w) => isCountedWorkout(w) && w.date >= start && w.date <= today);
  const workoutCount = inPeriod.length;
  const sets = inPeriod.reduce((sum, w) => sum + countedSets(w), 0);
  const targets = PERIOD_TARGETS[period];

  const strength = calculateStrengthProgress(workouts, period, today);
  const consistency = calculateConsistency(workouts, period, today);
  const prs = calculatePRProgress(workouts.filter((w) => w.date <= today), start);

  const components: ProgressScore["components"] = {
    strength: { value: strength.value, available: strength.available, weightFactor: strength.confidence },
    consistency: { value: consistency.value, available: workoutCount > 0, weightFactor: 1 },
    prProgress: { value: clamp01(prs.scored / targets.prs), available: workoutCount > 0, weightFactor: 1 },
    activity: {
      value: 0.5 * clamp01(workoutCount / targets.workouts) + 0.5 * clamp01(sets / targets.sets),
      available: workoutCount > 0,
      weightFactor: 1,
    },
  };

  if (workoutCount === 0) {
    return { period, hasData: false, score: 0, strength, components, workouts: 0, sets: 0, prs: 0 };
  }

  let weighted = 0;
  let weightSum = 0;
  for (const key of SCORE_COMPONENT_ORDER) {
    if (!components[key].available) continue;
    const weight = SCORE_WEIGHTS[key] * components[key].weightFactor;
    weighted += weight * components[key].value;
    weightSum += weight;
  }

  return {
    period,
    hasData: true,
    score: Math.round((weighted / weightSum) * MAX_SCORE),
    strength,
    components,
    workouts: workoutCount,
    sets,
    prs: prs.count,
  };
}

// --- Achievements ----------------------------------------------------------

export type AchievementId =
  | "firstWorkout"
  | "firstPr"
  | "workouts10"
  | "workouts25"
  | "workouts50"
  | "sets100"
  | "sets500"
  | "prs10"
  | "prs25"
  | "streak7"
  | "streak30";

export type Achievement = {
  id: AchievementId;
  target: number;
  /** Progress toward the target, never above it. */
  progress: number;
  unlocked: boolean;
};

const ACHIEVEMENT_DEFS: { id: AchievementId; metric: "workouts" | "sets" | "prs" | "streak"; target: number }[] = [
  { id: "firstWorkout", metric: "workouts", target: 1 },
  { id: "firstPr", metric: "prs", target: 1 },
  { id: "workouts10", metric: "workouts", target: 10 },
  { id: "workouts25", metric: "workouts", target: 25 },
  { id: "workouts50", metric: "workouts", target: 50 },
  { id: "sets100", metric: "sets", target: 100 },
  { id: "sets500", metric: "sets", target: 500 },
  { id: "prs10", metric: "prs", target: 10 },
  { id: "prs25", metric: "prs", target: 25 },
  { id: "streak7", metric: "streak", target: 7 },
  { id: "streak30", metric: "streak", target: 30 },
];

/** Milestones computed on the fly from saved workouts (all time) — no table. */
export function calculateAchievements(
  workouts: ScoreWorkout[],
  today: string = getTodayDateString(),
): Achievement[] {
  const counted = workouts.filter((w) => isCountedWorkout(w) && w.date <= today);
  const metrics = {
    workouts: counted.length,
    sets: counted.reduce((sum, w) => sum + countedSets(w), 0),
    prs: calculatePRProgress(counted).count,
    streak: calculateStreak(counted, today).longest,
  };

  return ACHIEVEMENT_DEFS.map(({ id, metric, target }) => ({
    id,
    target,
    progress: Math.min(metrics[metric], target),
    unlocked: metrics[metric] >= target,
  }));
}

/** Everything the `/progress` Overall section needs, for all three periods. */
export type ProgressOverview = {
  scores: Record<ScorePeriod, ProgressScore>;
  streak: StreakResult;
  achievements: Achievement[];
};

export function calculateProgressOverview(
  workouts: ScoreWorkout[],
  today: string = getTodayDateString(),
): ProgressOverview {
  return {
    scores: {
      "7": calculateProgressScore(workouts, "7", today),
      "30": calculateProgressScore(workouts, "30", today),
      "90": calculateProgressScore(workouts, "90", today),
    },
    streak: calculateStreak(workouts, today),
    achievements: calculateAchievements(workouts, today),
  };
}

// --- Leaderboard ranking ---------------------------------------------------

export const LEADERBOARD_TOP_N = 10;

export type LeaderboardCandidate = { userId: string; name: string; workouts: ScoreWorkout[] };

/** Public leaderboard row — only fields that are safe to show other users. */
export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  progressPct: number | null;
  workouts: number;
  prs: number;
  isCurrentUser: boolean;
};

export type Leaderboard = {
  period: ScorePeriod;
  top: LeaderboardEntry[];
  /** The current user's row when they're ranked (may also be inside `top`). */
  me: LeaderboardEntry | null;
  participants: number;
};

/** One ranked user, as kept server-side between requests. Unlike the public
 * `LeaderboardEntry` it carries `userId` (so a viewer's own row can be found
 * later) — it must never be sent to the client as-is. */
export type RankedUser = Omit<LeaderboardEntry, "isCurrentUser"> & { userId: string };

/** Scores every candidate with the shared formula and ranks them. Only users
 * with at least one saved workout in the period are ranked. Ties are broken
 * deterministically: score → strength → consistency → PRs → user id.
 *
 * The result does not depend on who is viewing, so it can be computed once
 * and shared by all viewers (see `buildLeaderboardView`). */
export function rankCandidates(
  candidates: LeaderboardCandidate[],
  period: ScorePeriod,
  today: string = getTodayDateString(),
): RankedUser[] {
  const scored = candidates
    .map((candidate) => {
      const result = calculateProgressScore(candidate.workouts, period, today);
      return { candidate, result };
    })
    .filter(({ result }) => result.hasData);

  scored.sort(
    (a, b) =>
      b.result.score - a.result.score ||
      b.result.components.strength.value - a.result.components.strength.value ||
      b.result.components.consistency.value - a.result.components.consistency.value ||
      b.result.prs - a.result.prs ||
      (a.candidate.userId < b.candidate.userId ? -1 : a.candidate.userId > b.candidate.userId ? 1 : 0),
  );

  return scored.map(({ candidate, result }, index) => ({
    userId: candidate.userId,
    rank: index + 1,
    name: candidate.name,
    score: result.score,
    progressPct: result.strength.progressPct,
    workouts: result.workouts,
    prs: result.prs,
  }));
}

/** The viewer-specific page model from a shared ranking: top N, the viewer's
 * own row, and the participant count — public fields only (no user ids). */
export function buildLeaderboardView(
  ranked: RankedUser[],
  period: ScorePeriod,
  currentUserId: string,
): Leaderboard {
  const entries: LeaderboardEntry[] = ranked.map(({ userId, ...entry }) => ({
    ...entry,
    isCurrentUser: userId === currentUserId,
  }));

  return {
    period,
    top: entries.slice(0, LEADERBOARD_TOP_N),
    me: entries.find((entry) => entry.isCurrentUser) ?? null,
    participants: entries.length,
  };
}

/** Ranks the candidates and builds the page model for `currentUserId`. */
export function rankLeaderboard(
  candidates: LeaderboardCandidate[],
  period: ScorePeriod,
  currentUserId: string,
  today: string = getTodayDateString(),
): Leaderboard {
  return buildLeaderboardView(rankCandidates(candidates, period, today), period, currentUserId);
}
