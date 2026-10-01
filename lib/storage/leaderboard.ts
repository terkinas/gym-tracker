import "server-only";

import { db } from "@/lib/db";
import { getScorePeriodStart, rankLeaderboard } from "@/lib/progress/analytics";
import type { Leaderboard, LeaderboardCandidate, ScorePeriod } from "@/lib/progress/analytics";
import { getTodayDateString } from "@/lib/date";

// Explicit row shape (matches the `select` below) so the mapping stays typed
// even where the generated Prisma client types aren't available.
type LeaderboardUserRow = {
  id: string;
  name: string;
  workouts: {
    date: string;
    exercises: { exerciseId: string; sets: { weight: number; reps: number }[] }[];
  }[];
};

/** Builds the leaderboard for a period with a FIXED number of queries — no
 * per-user or per-exercise queries (no N+1).
 *
 * One Prisma call loads every user that has a workout in the period together
 * with their full saved workout history (needed so strength baselines and PR
 * detection can compare against earlier results). Only what scoring needs is
 * selected: user id + display name, and each workout's date, exercise ids and
 * weight/reps. `username` and `passwordHash` are never read, and no individual
 * set data ever leaves `rankLeaderboard`, which returns public fields only.
 *
 * Scores are computed in memory by the same pure functions `/progress` uses.
 *
 * `currentUserId` must come from the authenticated session (see
 * `getCurrentUser()`), never from client input. */
export async function getLeaderboard(
  period: ScorePeriod,
  currentUserId: string,
): Promise<Leaderboard> {
  const today = getTodayDateString();
  const periodStart = getScorePeriodStart(period, today);

  const users: LeaderboardUserRow[] = await db.user.findMany({
    where: { workouts: { some: { date: { gte: periodStart } } } },
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      workouts: {
        select: {
          date: true,
          exercises: {
            select: {
              exerciseId: true,
              sets: { select: { weight: true, reps: true } },
            },
          },
        },
      },
    },
  });

  const candidates: LeaderboardCandidate[] = users.map((user) => ({
    userId: user.id,
    name: user.name,
    workouts: user.workouts,
  }));

  return rankLeaderboard(candidates, period, currentUserId, today);
}
