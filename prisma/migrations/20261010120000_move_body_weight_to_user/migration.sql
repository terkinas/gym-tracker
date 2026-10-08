-- Body weight becomes one current value per user (users.bodyWeight) instead of
-- a per-workout value.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "bodyWeight" DOUBLE PRECISION;

-- Keep what was already entered: each user's most recent per-workout body
-- weight becomes their current body weight.
UPDATE "users" AS u
SET "bodyWeight" = w."bodyWeight"
FROM (
  SELECT DISTINCT ON ("userId") "userId", "bodyWeight"
  FROM "workouts"
  WHERE "bodyWeight" IS NOT NULL
  ORDER BY "userId", "date" DESC
) AS w
WHERE u."id" = w."userId";

-- AlterTable
ALTER TABLE "workouts" DROP COLUMN "bodyWeight";
