"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/dal";
import {
  createExercise,
  deleteExercise,
  importCityGymDefaults,
  updateExercise,
} from "@/lib/storage/exercises";
import {
  EXERCISE_CATEGORIES,
  type Exercise,
  type ExerciseCategory,
  type ExerciseInput,
} from "@/lib/exercises";

// The user id always comes from the authenticated session (via requireUser),
// never from the client — a request can only ever act on its own exercises.

// Validates untrusted client input server-side. `isOneHanded` must be a real
// boolean (not a truthy string/number) and the category must be one of the
// known values — never trust the TypeScript types alone across the wire.
function validateExerciseInput(values: {
  name: string;
  category: ExerciseCategory;
  isOneHanded?: boolean;
}): ExerciseInput {
  const name = typeof values?.name === "string" ? values.name.trim() : "";

  if (!name) {
    throw new Error("INVALID_NAME");
  }

  if (!EXERCISE_CATEGORIES.includes(values.category)) {
    throw new Error("INVALID_CATEGORY");
  }

  if (values.isOneHanded !== undefined && typeof values.isOneHanded !== "boolean") {
    throw new Error("INVALID_ONE_HANDED");
  }

  return {
    name,
    category: values.category,
    isOneHanded: values.isOneHanded ?? false,
  };
}

export async function createExerciseAction(values: {
  name: string;
  category: ExerciseCategory;
  isOneHanded?: boolean;
}): Promise<Exercise> {
  const user = await requireUser();
  const input = validateExerciseInput(values);

  const exercise = await createExercise(user.id, input);
  revalidatePath("/pratimai");
  return exercise;
}

export async function updateExerciseAction(
  exerciseId: string,
  values: { name: string; category: ExerciseCategory; isOneHanded?: boolean },
): Promise<Exercise> {
  const user = await requireUser();
  const input = validateExerciseInput(values);

  const exercise = await updateExercise(user.id, exerciseId, input);
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
