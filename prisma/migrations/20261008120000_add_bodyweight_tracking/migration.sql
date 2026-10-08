-- AlterTable
-- Optional body weight (kg) entered for a workout. NULL for existing workouts.
ALTER TABLE "workouts" ADD COLUMN "bodyWeight" DOUBLE PRECISION;

-- AlterTable
-- Whether this workout exercise is a bodyweight exercise. Existing rows: false.
ALTER TABLE "workout_exercises" ADD COLUMN "usesBodyweight" BOOLEAN NOT NULL DEFAULT false;
