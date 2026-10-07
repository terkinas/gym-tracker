-- AlterTable
-- Secondary muscle groups per exercise (same text values as `category`).
ALTER TABLE "exercises" ADD COLUMN "secondaryMuscles" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
-- Existing sets default to hard sets so historic data keeps counting.
ALTER TABLE "workout_sets" ADD COLUMN "isHardSet" BOOLEAN NOT NULL DEFAULT true;
