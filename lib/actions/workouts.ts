"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/dal";
import { getTodayDateString } from "@/lib/date";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { createOrUpdateWorkout } from "@/lib/storage/workouts";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types/workout";

// Shape as it arrives from the client. Numbers are still untrusted input —
// they may be missing, NaN, negative, or non-integer — so every field is
// validated below before anything is written to disk.
export type SaveWorkoutSetInput = {
  id: string;
  weight: number;
  reps: number;
};

export type SaveWorkoutExerciseInput = {
  exerciseId: string;
  sets: SaveWorkoutSetInput[];
};

function isValidWeight(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidReps(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
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

  const userExercises = await getExercisesForUser(user.id);
  const userExerciseIds = new Set(userExercises.map((exercise) => exercise.id));

  const seenExerciseIds = new Set<string>();
  const validatedExercises: WorkoutExercise[] = [];

  for (const exercise of exercises) {
    if (typeof exercise.exerciseId !== "string" || exercise.exerciseId.length === 0) {
      throw new Error("INVALID_EXERCISE");
    }

    if (!userExerciseIds.has(exercise.exerciseId)) {
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

      return {
        id: typeof set.id === "string" && set.id.length > 0 ? set.id : crypto.randomUUID(),
        weight: set.weight,
        reps: set.reps,
      };
    });

    validatedExercises.push({ exerciseId: exercise.exerciseId, sets: validatedSets });
  }

  const workout = await createOrUpdateWorkout(user.id, {
    date: getTodayDateString(),
    exercises: validatedExercises,
  });

  revalidatePath("/treniruote");

  return workout;
}
