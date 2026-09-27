import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { Workout, WorkoutExercise } from "@/lib/types/workout";

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
    sets: { id: string; weight: number; reps: number }[];
  }[];
};

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    userId: row.userId,
    date: row.date,
    exercises: row.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        weight: set.weight,
        reps: set.reps,
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

/** Deletes a user's workout for a given date, if one exists. Provided for
 * completeness alongside the read/write functions above; no UI in this
 * phase triggers a whole-day delete yet. */
export async function deleteWorkout(userId: string, date: string): Promise<void> {
  // deleteMany (rather than delete) so calling this for a date with no
  // workout is a harmless no-op instead of throwing, matching the previous
  // JSON implementation's filter-based delete.
  await db.workout.deleteMany({ where: { userId, date } });
}
