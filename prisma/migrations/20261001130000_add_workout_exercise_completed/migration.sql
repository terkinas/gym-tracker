-- AlterTable
-- Adds a NOT NULL boolean with a constant default. Existing workout exercises
-- are backfilled with `false` by Postgres itself, so no data is lost or changed.
ALTER TABLE "workout_exercises" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
