import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { isSetHand, type SetHand, type Workout, type WorkoutExercise } from "@/lib/types/workout";

// Shape returned by every query below: a Workout row with its exercises and
// each exercise's sets, both ordered by the `position` column so the array
// order the rest of the app relies on (see prisma/schema.prisma) survives
// the round trip through a database that has no native notion of array
// order.
const WORKOUT_INCLUDE = {
  exercises: {
    orderBy: { position: "asc" as const },
    include: {
      sets: { orderBy: { position: "asc" as const } },
    },
  },
};

type WorkoutRow = {
  id: string;
  userId: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
  exercises: {
    exerciseId: string;
    completed: boolean;
    usesBodyweight: boolean;
    sets: {
      id: string;
      weight: number;
      reps: number;
      hand: string | null;
      isHardSet: boolean;
    }[];
  }[];
};

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    exercises: row.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      completed: exercise.completed,
      usesBodyweight: exercise.usesBodyweight,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        weight: set.weight,
        reps: set.reps,
        hand: isSetHand(set.hand) ? set.hand : null,
        isHardSet: set.isHardSet,
      })),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** All of a user's workouts, unsorted. Used by the progress dashboard to
 * derive every metric from a single read — callers must always pass a
 * userId that came from the authenticated session, never from client
 * input. */
export async function getWorkoutsForUser(userId: string): Promise<Workout[]> {
  const rows = await db.workout.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    include: WORKOUT_INCLUDE,
  });
  return rows.map(toWorkout);
}

/** One workout per user per date — callers must always pass a userId that
 * came from the authenticated session, never from client input. */
export async function getWorkoutByDate(
  userId: string,
  date: string,
): Promise<Workout | null> {
  const row = await db.workout.findUnique({
    where: { userId_date: { userId, date } },
    include: WORKOUT_INCLUDE,
  });
  return row ? toWorkout(row) : null;
}

/** Creates today's workout if it doesn't exist yet, or replaces its exercise
 * list otherwise. `date` should always come from the server (see
 * `getTodayDateString`), never from the client.
 *
 * Runs as a single Prisma transaction: the old exercise/set rows for the
 * day are torn down and the new ones written back in the same transaction,
 * so a failure partway through (e.g. a dropped connection) rolls back
 * cleanly instead of leaving the workout with only some of its exercises
 * saved. */
export async function createOrUpdateWorkout(
  userId: string,
  data: { date: string; exercises: WorkoutExercise[] },
): Promise<Workout> {
  const row = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    // Touch-or-create the workout row itself. The `update: {}` branch still
    // bumps `updatedAt` (it's `@updatedAt` in the schema) without touching
    // anything else, matching the previous behavior of always refreshing
    // updatedAt on save while only setting createdAt once.
    const workout = await tx.workout.upsert({
      where: { userId_date: { userId, date: data.date } },
      create: { userId, date: data.date },
      update: {},
    });

    // Replace this workout's exercises wholesale rather than diffing —
    // simpler, and matches the previous JSON implementation, which always
    // wrote the whole `exercises` array it was given. Deleting the
    // WorkoutExercise rows cascades to their WorkoutSet rows (see
    // prisma/schema.prisma), so this alone clears out the old sets too.
    await tx.workoutExercise.deleteMany({ where: { workoutId: workout.id } });

    for (const [exerciseIndex, exercise] of data.exercises.entries()) {
      await tx.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: exercise.exerciseId,
          completed: exercise.completed,
          usesBodyweight: exercise.usesBodyweight,
          position: exerciseIndex,
          sets: {
            create: exercise.sets.map((set, setIndex) => ({
              // Keep the id the caller already assigned (see
              // saveWorkoutAction, which fills in a fresh
              // crypto.randomUUID() for any set that doesn't have one yet)
              // rather than letting Prisma generate a new one, so ids stay
              // stable across saves the way they did with the JSON store.
              id: set.id,
              weight: set.weight,
              reps: set.reps,
              hand: set.hand,
              isHardSet: set.isHardSet,
              position: setIndex,
            })),
          },
        },
      });
    }

    return tx.workout.findUniqueOrThrow({
      where: { id: workout.id },
      include: WORKOUT_INCLUDE,
    });
  });

  return toWorkout(row);
}

/** Flips the `completed` flag of one exercise in the user's workout for
 * `date`, without touching sets or any other exercise. Ownership is enforced
 * in the query itself (the workout must belong to `userId`), so another
 * user's rows can never match. Returns whether a persisted row was updated —
 * `false` means the exercise isn't saved in that workout yet (the flag then
 * travels with the next explicit save). `userId` must come from the
 * authenticated session. */
export async function setWorkoutExerciseCompleted(
  userId: string,
  date: string,
  exerciseId: string,
  completed: boolean,
): Promise<boolean> {
  const result = await db.workoutExercise.updateMany({
    where: { exerciseId, workout: { userId, date } },
    data: { completed },
  });
  return result.count > 0;
}

/** Deletes a user's workout for a given date, if one exists. Used by
 * `clearTodayWorkoutAction` when the last exercise is removed from today's
 * workout. Cascades to the day's exercises and sets. */
export async function deleteWorkout(userId: string, date: string): Promise<void> {
  // deleteMany (rather than delete) so calling this for a date with no
  // workout is a harmless no-op instead of throwing, matching the previous
  // JSON implementation's filter-based delete.
  await db.workout.deleteMany({ where: { userId, date } });
}

/** A page of a user's saved workouts, newest first, for the history list.
 * Fetches `limit + 1` rows so the caller can tell whether more exist
 * without a separate count query. `userId` must come from the
 * authenticated session, never from client input. */
export async function getWorkoutHistoryForUser(
  userId: string,
  limit: number,
): Promise<{ workouts: Workout[]; hasMore: boolean }> {
  const rows = await db.workout.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    include: WORKOUT_INCLUDE,
  });
  const hasMore = rows.length > limit;
  return { workouts: rows.slice(0, limit).map(toWorkout), hasMore };
}

/** One workout by id, scoped to its owner. Querying by BOTH id and userId
 * means another user's workout id resolves to `null` (→ notFound()) rather
 * than leaking its contents. */
export async function getWorkoutByIdForUser(
  userId: string,
  workoutId: string,
): Promise<Workout | null> {
  const row = await db.workout.findFirst({
    where: { id: workoutId, userId },
    include: WORKOUT_INCLUDE,
  });
  return row ? toWorkout(row) : null;
}

/** What a user did the last time they performed an exercise, strictly
 * before `beforeDate` (today's workout — saved or not — is never "last
 * time"). Sets are exactly as stored: one-handed exercises keep their single
 * combined weight/reps, so there's nothing special to do for them. */
export type LastExerciseSession = {
  date: string;
  /** The exercise was a bodyweight exercise that time (set weights = extra). */
  usesBodyweight: boolean;
  sets: { weight: number; reps: number; hand: SetHand | null }[];
};

/** Resolves "last time" for many exercises with a fixed number of queries
 * (two), regardless of how many exercises are requested — no per-exercise
 * N+1. Returns a map keyed by `exerciseId`; exercises with no earlier
 * workout containing sets are simply absent.
 *
 * `userId` must come from the authenticated session, never from the
 * client. */
export async function getLastWorkoutDataForExercises(
  userId: string,
  exerciseIds: string[],
  beforeDate: string,
): Promise<Record<string, LastExerciseSession>> {
  if (exerciseIds.length === 0) return {};

  // 1) Lightweight: which workout-exercise row is the most recent one per
  //    exercise (no set rows loaded yet). `date` is YYYY-MM-DD text, so
  //    `lt` / ordering match chronological order.
  const candidates = await db.workoutExercise.findMany({
    where: {
      exerciseId: { in: exerciseIds },
      sets: { some: {} },
      workout: { userId, date: { lt: beforeDate } },
    },
    orderBy: { workout: { date: "desc" } },
    select: {
      id: true,
      exerciseId: true,
      usesBodyweight: true,
      workout: { select: { date: true } },
    },
  });

  const latestByExercise = new Map<
    string,
    { id: string; date: string; usesBodyweight: boolean }
  >();
  for (const row of candidates) {
    if (!latestByExercise.has(row.exerciseId)) {
      latestByExercise.set(row.exerciseId, {
        id: row.id,
        date: row.workout.date,
        usesBodyweight: row.usesBodyweight,
      });
    }
  }
  if (latestByExercise.size === 0) return {};

  // 2) Load the sets for just those rows.
  const rows = await db.workoutExercise.findMany({
    where: { id: { in: [...latestByExercise.values()].map((v) => v.id) } },
    select: {
      id: true,
      sets: {
        orderBy: { position: "asc" },
        select: { weight: true, reps: true, hand: true },
      },
    },
  });
  const setsById = new Map<string, LastExerciseSession["sets"]>(
    rows.map(
      (r: {
        id: string;
        sets: { weight: number; reps: number; hand: string | null }[];
      }) => [
        r.id,
        r.sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          hand: isSetHand(set.hand) ? set.hand : null,
        })),
      ],
    ),
  );

  const result: Record<string, LastExerciseSession> = {};
  for (const [exerciseId, { id, date, usesBodyweight }] of latestByExercise) {
    result[exerciseId] = { date, usesBodyweight, sets: setsById.get(id) ?? [] };
  }
  return result;
}

/** Ids + dates of a user's workouts within one month (`YYYY-MM`), for the
 * history calendar. `userId` must come from the authenticated session. */
export async function getWorkoutDaysForMonth(
  userId: string,
  month: string,
): Promise<{ id: string; date: string }[]> {
  return db.workout.findMany({
    where: { userId, date: { startsWith: `${month}-` } },
    orderBy: { date: "asc" },
    select: { id: true, date: true },
  });
}
