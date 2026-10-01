-- AlterTable
-- Adds a NOT NULL boolean with a constant default. Existing rows are
-- backfilled with `false` by Postgres itself, so no data is lost or changed.
ALTER TABLE "exercises" ADD COLUMN "isOneHanded" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark existing CityGym default one-handed exercises (matched by the
-- exact default names) so users who already imported them get the new hint.
UPDATE "exercises"
SET "isOneHanded" = true
WHERE "name" IN ('Single-Arm Lateral Raise', 'Dumbbell Supinating Curl');
