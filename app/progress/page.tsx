import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { getCurrentUser } from "@/lib/auth/dal";
import { calculateProgressOverview } from "@/lib/progress/analytics";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getWorkoutsForAnalytics } from "@/lib/storage/workouts";
import { getTranslations } from "@/lib/i18n/get-translations";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.progress.pageTitle} · GymTracker` };
}

export default async function ProgressPage() {
  const user = await getCurrentUser();

  // The proxy already protects this route, but fall back to /login rather
  // than trust that unconditionally.
  if (!user) {
    redirect("/login");
  }

  // Load once, then derive every metric (summary, charts, categories,
  // per-exercise progress) from these same two arrays — both server-side
  // for the first render and client-side as the user changes filters.
  const [workouts, exercises] = await Promise.all([
    getWorkoutsForAnalytics(user.id),
    getExercisesForUser(user.id),
  ]);

  // Score / streak / achievements use the same pure functions as the
  // leaderboard, on this user's own saved workouts only.
  const overview = calculateProgressOverview(workouts);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <ProgressDashboard workouts={workouts} exercises={exercises} overview={overview} />
    </div>
  );
}
