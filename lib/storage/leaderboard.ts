import "server-only";

import { unstable_cache } from "next/cache";

import { db, RELATION_LOAD_STRATEGY } from "@/lib/db";
import { buildLeaderboardView, rankCandidates } from "@/lib/progress/analytics";
import type {
  Leaderboard,
  LeaderboardCandidate,
  RankedUser,
  ScorePeriod,
} from "@/lib/progress/analytics";
import { getScorePeriodStart } from "@/lib/progress/analytics";
import { getTodayDateString } from "@/lib/date";

/** Cache tag for the shared ranking. Revalidate it whenever any user's saved
 * workouts change (see lib/actions/workouts.ts). */
export const LEADERBOARD_CACHE_TAG = "leaderboard";

/** Upper bound on how stale a shared ranking can get if an invalidation is
 * ever missed (e.g. a workout changed outside the app). */
const LEADERBOARD_CACHE_SECONDS = 120;

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

/** Loads and scores every user with a workout in the period, with a FIXED
 * number of queries — no per-user or per-exercise queries (no N+1).
 *
 * One Prisma call loads every user that has a workout in the period together
 * with their full saved workout history (needed so strength baselines and PR
 * detection can compare against earlier results). Only what scoring needs is
 * selected: user id + display name, and each workout's date, exercise ids and
 * weight/reps. `username` and `passwordHash` are never read.
 *
 * The ranking does not depend on who is looking at it, so this is what gets
 * cached and shared between viewers. It contains user ids and therefore stays
 * server-side: `getLeaderboard` turns it into the public page model. */
async function computeRanking(period: ScorePeriod, today: string): Promise<RankedUser[]> {
  const periodStart = getScorePeriodStart(period, today);

  const users: LeaderboardUserRow[] = await db.user.findMany({
    relationLoadStrategy: RELATION_LOAD_STRATEGY,
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

  return rankCandidates(candidates, period, today);
}

// Shared across requests and users (same period + same day => same ranking).
// `period` and `today` are the function arguments, so they are part of the
// cache key. Nothing request-specific (cookies, the viewer) is read inside.
const getCachedRanking = unstable_cache(computeRanking, ["leaderboard-ranking"], {
  revalidate: LEADERBOARD_CACHE_SECONDS,
  tags: [LEADERBOARD_CACHE_TAG],
});

/** Builds the leaderboard for a period.
 *
 * The expensive part (loading everyone's history and scoring it) is shared and
 * cached; only the cheap viewer-specific part (top N, "my row") runs per
 * request, in memory. Scores come from the same pure functions `/progress`
 * uses. Only public fields are returned.
 *
 * `currentUserId` must come from the authenticated session (see
 * `getCurrentUser()`), never from client input. */
export async function getLeaderboard(
  period: ScorePeriod,
  currentUserId: string,
): Promise<Leaderboard> {
  const today = getTodayDateString();

  let ranked: RankedUser[];
  try {
    ranked = await getCachedRanking(period, today);
  } catch (error) {
    // The cache layer is an optimisation: if it is unavailable, compute
    // directly rather than failing the page.
    console.error("[leaderboard] cache unavailable, computing directly", error);
    ranked = await computeRanking(period, today);
  }

  return buildLeaderboardView(ranked, period, currentUserId);
}
