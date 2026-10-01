-- AlterTable
-- Nullable text column: existing sets (one-handed or not) keep `hand = NULL`.
-- Allowed values ("left" / "right") are validated by the server action.
ALTER TABLE "workout_sets" ADD COLUMN "hand" TEXT;
