import "server-only";

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  CITYGYM_DEFAULT_EXERCISES,
  type Exercise,
  type ExerciseCategory,
  type ExerciseInput,
  isExerciseCategory,
} from "@/lib/exercises";

function toExercise(row: {
  id: string;
  userId: string;
  name: string;
  category: string;
  isOneHanded: boolean;
  secondaryMuscles: string[];
  createdAt: Date;
}): Exercise {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    // The DB column is a plain string (see prisma/schema.prisma); the
    // category values it holds are always one of ExerciseCategory because
    // every write path (createExercise/updateExercise below) is typed to
    // ExerciseCategory.
    category: row.category as ExerciseCategory,
    isOneHanded: row.isOneHanded,
    secondaryMuscles: row.secondaryMuscles.filter(isExerciseCategory),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getExercisesForUser(userId: string): Promise<Exercise[]> {
  const rows = await db.exercise.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toExercise);
}

export async function createExercise(
  userId: string,
  data: ExerciseInput,
): Promise<Exercise> {
  const row = await db.exercise.create({
    data: {
      userId,
      name: data.name,
      category: data.category,
      isOneHanded: data.isOneHanded,
      secondaryMuscles: data.secondaryMuscles,
    },
  });
  return toExercise(row);
}

export async function updateExercise(
  userId: string,
  exerciseId: string,
  data: ExerciseInput,
): Promise<Exercise> {
  // Scope the update to this user's own row in a single statement — never
  // fetch-then-write, so there's no window where a check and the write it
  // guards can disagree, and a mismatched userId can never edit another
  // user's exercise.
  const { count } = await db.exercise.updateMany({
    where: { id: exerciseId, userId },
    data: {
      name: data.name,
      category: data.category,
      isOneHanded: data.isOneHanded,
      secondaryMuscles: data.secondaryMuscles,
    },
  });

  if (count === 0) {
    throw new Error("NOT_FOUND");
  }

  const updated = await db.exercise.findUniqueOrThrow({ where: { id: exerciseId } });
  return toExercise(updated);
}

export async function deleteExercise(userId: string, exerciseId: string): Promise<void> {
  const { count } = await db.exercise.deleteMany({
    where: { id: exerciseId, userId },
  });

  if (count === 0) {
    throw new Error("NOT_FOUND");
  }
}

/**
 * Imports the predefined CityGym exercise list for `userId`.
 *
 * The whole check-then-insert runs inside a single Prisma transaction so
 * there's no window between the "does this user already have exercises"
 * check and the insert itself. If the user already has any exercises
 * (e.g. a duplicate click, or two tabs racing each other) this throws
 * "EXERCISES_ALREADY_EXIST" instead of creating a second batch of 25 rows —
 * the caller (the server action) treats that as a no-op, not a crash.
 */
export async function importCityGymDefaults(userId: string): Promise<Exercise[]> {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingCount = await tx.exercise.count({ where: { userId } });
    if (existingCount > 0) {
      throw new Error("EXERCISES_ALREADY_EXIST");
    }

    await tx.exercise.createMany({
      data: CITYGYM_DEFAULT_EXERCISES.map((exercise) => ({
        userId,
        name: exercise.name,
        category: exercise.category,
        isOneHanded: exercise.isOneHanded ?? false,
        secondaryMuscles: exercise.secondaryMuscles ?? [],
      })),
    });

    const rows = await tx.exercise.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toExercise);
  });
}
