"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/dal";
import {
  createExercise,
  deleteExercise,
  importCityGymDefaults,
  updateExercise,
} from "@/lib/storage/exercises";
import type { Exercise, ExerciseCategory } from "@/lib/exercises";

// The user id always comes from the authenticated session (via requireUser),
// never from the client — a request can only ever act on its own exercises.

export async function createExerciseAction(values: {
  name: string;
  category: ExerciseCategory;
}): Promise<Exercise> {
  const user = await requireUser();
  const name = values.name.trim();

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  const exercise = await createExercise(user.id, { name, category: values.category });
  revalidatePath("/pratimai");
  return exercise;
}

export async function updateExerciseAction(
  exerciseId: string,
  values: { name: string; category: ExerciseCategory },
): Promise<Exercise> {
  const user = await requireUser();
  const name = values.name.trim();

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  const exercise = await updateExercise(user.id, exerciseId, {
    name,
    category: values.category,
  });
  revalidatePath("/pratimai");
  return exercise;
}

export async function deleteExerciseAction(exerciseId: string): Promise<void> {
  const user = await requireUser();
  await deleteExercise(user.id, exerciseId);
  revalidatePath("/pratimai");
}

// Imports the predefined CityGym exercise list into the authenticated
// user's own exercises. `userId` never comes from the client — it's read
// exclusively from the session via requireUser(), same as every other
// action in this file.
export async function importCityGymDefaultsAction(): Promise<Exercise[]> {
  const user = await requireUser();

  try {
    const exercises = await importCityGymDefaults(user.id);
    revalidatePath("/pratimai");
    return exercises;
  } catch (err) {
    if (err instanceof Error && err.message === "EXERCISES_ALREADY_EXIST") {
      throw err;
    }
    throw new Error("IMPORT_FAILED");
  }
}
