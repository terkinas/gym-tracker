"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireUser } from "@/lib/auth/dal";
import { getTodayDateString } from "@/lib/date";
import { getOwnedExerciseFlags } from "@/lib/storage/exercises";
import { LEADERBOARD_CACHE_TAG } from "@/lib/storage/leaderboard";
import {
  createOrUpdateWorkout,
  deleteWorkout,
  setWorkoutExerciseCompleted,
} from "@/lib/storage/workouts";
import { isSetHand, type SetHand, type Workout, type WorkoutExercise, type WorkoutSet } from "@/lib/types/workout";

// Shape as it arrives from the client. Numbers are still untrusted input —
// they may be missing, NaN, negative, or non-integer — so every field is
// validated below before anything is written to disk.
export type SaveWorkoutSetInput = {
  id: string;
  weight: number;
  reps: number;
  /** "left" | "right" | null; ignored (stored as null) for exercises that
   * aren't one-handed. Untrusted — validated below. */
  hand?: SetHand | null;
  /** Counts towards weekly hard-set volume. Missing → true (older clients). */
  isHardSet?: boolean;
};

export type SaveWorkoutExerciseInput = {
  exerciseId: string;
  /** Optional for backwards compatibility; anything but `true` means false. */
  completed?: boolean;
  /** Bodyweight exercise (set weights are extra weight). Missing → false. */
  usesBodyweight?: boolean;
  sets: SaveWorkoutSetInput[];
};

function isValidWeight(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidReps(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/** Marks the shared leaderboard ranking stale after any workout change, so
 * the next leaderboard visit recomputes it instead of serving the cached
 * copy. `{ expire: 1 }` is stale-while-revalidate: at most about one second
 * of stale data can still be served right after a save, and the call itself
 * adds nothing to the action response. (It does NOT clear the browser's page
 * cache — that is what `revalidatePath` next to it is for.) */
function invalidateLeaderboardCache() {
  revalidateTag(LEADERBOARD_CACHE_TAG, { expire: 1 });
}

/** Saves today's workout for the authenticated user. The workout's date is
 * always today's date computed on the server (see `getTodayDateString`) —
 * a date is never accepted from the client. Every exercise id is checked
 * against the caller's own exercises, so a request can never save a
 * workout referencing another user's exercise. */
export async function saveWorkoutAction(
  exercises: SaveWorkoutExerciseInput[],
): Promise<Workout> {
  const user = await requireUser();

  if (!Array.isArray(exercises) || exercises.length === 0) {
    throw new Error("EMPTY_WORKOUT");
  }

  // Ownership check: one narrow read of just the exercises this request
  // references, scoped to the session user (not the whole exercise list).
  const requestedIds = new Set<string>();
  for (const exercise of exercises) {
    if (typeof exercise?.exerciseId === "string" && exercise.exerciseId.length > 0) {
      requestedIds.add(exercise.exerciseId);
    }
  }
  const ownedExercises = await getOwnedExerciseFlags(user.id, [...requestedIds]);

  const seenExerciseIds = new Set<string>();
  const validatedExercises: WorkoutExercise[] = [];

  for (const exercise of exercises) {
    if (typeof exercise.exerciseId !== "string" || exercise.exerciseId.length === 0) {
      throw new Error("INVALID_EXERCISE");
    }

    if (!ownedExercises.has(exercise.exerciseId)) {
      // Either a forged id or an exercise that has since been deleted.
      throw new Error("EXERCISE_NOT_FOUND");
    }

    if (seenExerciseIds.has(exercise.exerciseId)) {
      throw new Error("DUPLICATE_EXERCISE");
    }
    seenExerciseIds.add(exercise.exerciseId);

    if (!Array.isArray(exercise.sets)) {
      throw new Error("INVALID_SETS");
    }

    const validatedSets: WorkoutSet[] = exercise.sets.map((set) => {
      if (!isValidWeight(set.weight)) {
        throw new Error("INVALID_WEIGHT");
      }
      if (!isValidReps(set.reps)) {
        throw new Error("INVALID_REPS");
      }

      // Only null / "left" / "right" are ever accepted.
      if (set.hand !== undefined && set.hand !== null && !isSetHand(set.hand)) {
        throw new Error("INVALID_HAND");
      }

      if (set.isHardSet !== undefined && typeof set.isHardSet !== "boolean") {
        throw new Error("INVALID_HARD_SET");
      }

      return {
        id: typeof set.id === "string" && set.id.length > 0 ? set.id : crypto.randomUUID(),
        weight: set.weight,
        reps: set.reps,
        // A hand is only stored for one-handed exercises (normalized to null
        // for all others); legacy/unchosen one-handed sets stay null.
        hand:
          ownedExercises.get(exercise.exerciseId)?.isOneHanded === true && isSetHand(set.hand)
            ? set.hand
            : null,
        isHardSet: set.isHardSet ?? true,
      };
    });

    if (exercise.usesBodyweight !== undefined && typeof exercise.usesBodyweight !== "boolean") {
      throw new Error("INVALID_USES_BODYWEIGHT");
    }

    validatedExercises.push({
      exerciseId: exercise.exerciseId,
      completed: exercise.completed === true,
      usesBodyweight: exercise.usesBodyweight === true,
      sets: validatedSets,
    });
  }

  const workout = await createOrUpdateWorkout(user.id, {
    date: getTodayDateString(),
    exercises: validatedExercises,
  });

  // Re-render /treniruote and drop the browser's cached copies of pages.
  // This is NOT redundant: Next reuses cached pages on browser back/forward
  // (and, with `staleTimes`, for a short while on normal navigation). Without
  // this, going Save -> another page -> Back would restore /treniruote with
  // the workout as it was BEFORE this save, and saving again from that stale
  // screen would overwrite what was just saved.
  revalidatePath("/treniruote");
  invalidateLeaderboardCache();

  return workout;
}

/** Deletes today's saved workout for the authenticated user. Called when the
 * user removes the LAST exercise from the workout screen, so a day that has
 * nothing left in it stops existing in the database — and therefore stops
 * showing up in the history calendar, the history list and the progress and
 * records pages. A no-op when nothing is saved for today. As with every other
 * workout action, the user comes from the session and the date from the
 * server, so a client can't clear another user's (or another day's) workout. */
export async function clearTodayWorkoutAction(): Promise<void> {
  const user = await requireUser();

  await deleteWorkout(user.id, getTodayDateString());
  invalidateLeaderboardCache();

  // Every page that is derived from saved workouts.
  revalidatePath("/treniruote");
  revalidatePath("/istorija", "layout");
  revalidatePath("/progress");
  revalidatePath("/rekordai");
}

/** Persists the "I'm done with this exercise" state for today's workout of
 * the authenticated user. Scoped by session user + server-side date, so a
 * client can never flip another user's workout exercise. Returns whether the
 * exercise was already saved in today's workout; if not, nothing is written
 * (no autosave) and the client sends `completed` with its next explicit save. */
export async function setExerciseCompletedAction(
  exerciseId: string,
  completed: boolean,
): Promise<{ persisted: boolean }> {
  const user = await requireUser();

  if (typeof exerciseId !== "string" || exerciseId.length === 0) {
    throw new Error("INVALID_EXERCISE");
  }
  if (typeof completed !== "boolean") {
    throw new Error("INVALID_COMPLETED");
  }

  const persisted = await setWorkoutExerciseCompleted(
    user.id,
    getTodayDateString(),
    exerciseId,
    completed,
  );

  // Same reason as in saveWorkoutAction: a cached /treniruote must not come
  // back (Back button, staleTimes) showing the old "done" state.
  if (persisted) revalidatePath("/treniruote");

  return { persisted };
}
