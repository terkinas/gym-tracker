/**
 * One-off migration: imports the legacy data/*.json files into PostgreSQL
 * via Prisma.
 *
 * Usage:
 *   npx tsx scripts/migrate-json-to-postgres.ts
 *   (or: npm run migrate:json)
 *
 * Safe to run more than once: every record is upserted (users, exercises)
 * or fully replaced per-workout (a workout's exercises/sets are deleted and
 * rewritten from the JSON, exactly like a normal save through the app), so
 * re-running this script does not create duplicates.
 *
 * Does NOT touch the source JSON files — they are only ever read, never
 * deleted or modified — and does NOT re-hash any passwordHash, since it is
 * already a bcrypt hash produced at registration time.
 */

import fs from "node:fs/promises";
import path from "node:path";

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), "data");

type JsonUser = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  createdAt?: string;
};

type JsonExercise = {
  id: string;
  userId: string;
  name: string;
  category: string;
  createdAt?: string;
};

type JsonWorkoutSet = {
  id: string;
  weight: number;
  reps: number;
};

type JsonWorkoutExercise = {
  exerciseId: string;
  sets: JsonWorkoutSet[];
};

type JsonWorkout = {
  id: string;
  userId: string;
  date: string;
  exercises: JsonWorkoutExercise[];
  createdAt?: string;
  updatedAt?: string;
};

type Counts = {
  usersImported: number;
  usersSkipped: number;
  exercisesImported: number;
  exercisesSkipped: number;
  workoutsImported: number;
  workoutsSkipped: number;
  workoutExercisesImported: number;
  workoutSetsImported: number;
};

const counts: Counts = {
  usersImported: 0,
  usersSkipped: 0,
  exercisesImported: 0,
  exercisesSkipped: 0,
  workoutsImported: 0,
  workoutsSkipped: 0,
  workoutExercisesImported: 0,
  workoutSetsImported: 0,
};

const errors: string[] = [];

async function readJsonFile<T>(fileName: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      errors.push(`${fileName}: turinys nėra masyvas, praleidžiama.`);
      return [];
    }
    return parsed as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log(`(info) ${fileName} nerastas — praleidžiama.`);
      return [];
    }
    errors.push(`${fileName}: nepavyko nuskaityti (${(error as Error).message}).`);
    return [];
  }
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function migrateUsers(users: JsonUser[]) {
  for (const user of users) {
    try {
      if (!user.id || !user.username || !user.passwordHash) {
        errors.push(`users.json: praleistas įrašas be id/username/passwordHash (id=${user.id ?? "?"}).`);
        counts.usersSkipped += 1;
        continue;
      }

      const createdAt = toDate(user.createdAt);

      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          username: user.username.trim().toLowerCase(),
          // passwordHash is intentionally NOT re-hashed — it is copied
          // as-is, since it is already a bcrypt hash.
          passwordHash: user.passwordHash,
        },
        create: {
          id: user.id,
          name: user.name,
          username: user.username.trim().toLowerCase(),
          passwordHash: user.passwordHash,
          ...(createdAt ? { createdAt } : {}),
        },
      });

      counts.usersImported += 1;
    } catch (error) {
      errors.push(`users.json (id=${user.id}): ${(error as Error).message}`);
      counts.usersSkipped += 1;
    }
  }
}

async function migrateExercises(exercises: JsonExercise[]) {
  for (const exercise of exercises) {
    try {
      if (!exercise.id || !exercise.userId || !exercise.name || !exercise.category) {
        errors.push(`exercises.json: praleistas nepilnas įrašas (id=${exercise.id ?? "?"}).`);
        counts.exercisesSkipped += 1;
        continue;
      }

      const createdAt = toDate(exercise.createdAt);

      await prisma.exercise.upsert({
        where: { id: exercise.id },
        update: {
          userId: exercise.userId,
          name: exercise.name,
          category: exercise.category,
        },
        create: {
          id: exercise.id,
          userId: exercise.userId,
          name: exercise.name,
          category: exercise.category,
          ...(createdAt ? { createdAt } : {}),
        },
      });

      counts.exercisesImported += 1;
    } catch (error) {
      errors.push(`exercises.json (id=${exercise.id}): ${(error as Error).message}`);
      counts.exercisesSkipped += 1;
    }
  }
}

async function migrateWorkouts(workouts: JsonWorkout[]) {
  for (const workout of workouts) {
    try {
      if (!workout.id || !workout.userId || !workout.date || !Array.isArray(workout.exercises)) {
        errors.push(`workouts.json: praleistas nepilnas įrašas (id=${workout.id ?? "?"}).`);
        counts.workoutsSkipped += 1;
        continue;
      }

      const createdAt = toDate(workout.createdAt);
      const updatedAt = toDate(workout.updatedAt);

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.workout.upsert({
          where: { id: workout.id },
          update: {
            userId: workout.userId,
            date: workout.date,
          },
          create: {
            id: workout.id,
            userId: workout.userId,
            date: workout.date,
            ...(createdAt ? { createdAt } : {}),
          },
        });

        // Full replace, exactly like a normal save through the app — this
        // is what makes re-running the script safe.
        await tx.workoutExercise.deleteMany({ where: { workoutId: workout.id } });

        for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
          if (!exercise.exerciseId || !Array.isArray(exercise.sets)) {
            errors.push(
              `workouts.json (workout=${workout.id}): praleistas nepilnas pratimo įrašas.`,
            );
            continue;
          }

          await tx.workoutExercise.create({
            data: {
              workoutId: workout.id,
              exerciseId: exercise.exerciseId,
              position: exerciseIndex,
              sets: {
                create: exercise.sets
                  .filter((set) => set && typeof set.weight === "number" && typeof set.reps === "number")
                  .map((set, setIndex) => ({
                    id: set.id ?? crypto.randomUUID(),
                    weight: set.weight,
                    reps: set.reps,
                    position: setIndex,
                  })),
              },
            },
          });

          counts.workoutExercisesImported += 1;
          counts.workoutSetsImported += exercise.sets.length;
        }

        // updatedAt is `@updatedAt`, so Prisma overwrites it with "now" on
        // every update above. Restore the original value from the JSON
        // file, if there was one, as the very last write in the
        // transaction so the migrated row reflects real history instead of
        // the migration's own run time.
        if (updatedAt) {
          await tx.$executeRaw`UPDATE "workouts" SET "updatedAt" = ${updatedAt} WHERE "id" = ${workout.id}`;
        }
      });

      counts.workoutsImported += 1;
    } catch (error) {
      errors.push(`workouts.json (id=${workout.id}): ${(error as Error).message}`);
      counts.workoutsSkipped += 1;
    }
  }
}

async function main() {
  console.log("JSON → PostgreSQL migracija: pradedama...\n");

  const [users, exercises, workouts] = await Promise.all([
    readJsonFile<JsonUser>("users.json"),
    readJsonFile<JsonExercise>("exercises.json"),
    readJsonFile<JsonWorkout>("workouts.json"),
  ]);

  // Order matters: exercises and workouts don't have DB-level foreign keys
  // forcing this (see prisma/schema.prisma for why), but importing users
  // first still makes sense so exercises/workouts land against a user that
  // already exists.
  await migrateUsers(users);
  await migrateExercises(exercises);
  await migrateWorkouts(workouts);

  console.log("\n=== Migracijos rezultatai ===");
  console.log(`Users:              importuota ${counts.usersImported}, praleista ${counts.usersSkipped}`);
  console.log(`Exercises:          importuota ${counts.exercisesImported}, praleista ${counts.exercisesSkipped}`);
  console.log(`Workouts:           importuota ${counts.workoutsImported}, praleista ${counts.workoutsSkipped}`);
  console.log(`Workout exercises:  importuota ${counts.workoutExercisesImported}`);
  console.log(`Workout sets:       importuota ${counts.workoutSetsImported}`);

  if (errors.length > 0) {
    console.log(`\nKlaidos (${errors.length}):`);
    for (const message of errors) {
      console.log(`  - ${message}`);
    }
  } else {
    console.log("\nKlaidų nebuvo.");
  }
}

main()
  .catch((error) => {
    console.error("Migracija nutrūko dėl netikėtos klaidos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
