import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WorkoutPage } from "@/components/workout/workout-page";
import { getCurrentUser } from "@/lib/auth/dal";
import { getTodayDateString } from "@/lib/date";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getUserBodyWeightRecord } from "@/lib/storage/users";
import { getLastWorkoutDataForExercises, getWorkoutByDate } from "@/lib/storage/workouts";
import type { LastExerciseSession } from "@/lib/storage/workouts";
import { getTranslations } from "@/lib/i18n/get-translations";
import { formatDate } from "@/lib/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.workout.pageTitle} · GymTracker` };
}

export default async function TreniruotePage() {
  const [user, { locale }] = await Promise.all([getCurrentUser(), getTranslations()]);
  if (!user) redirect("/login");
  const today = getTodayDateString();

  // All four reads depend only on the session's user id and today's date, so
  // they run together instead of one after another. "Last time" is
  // informational only: the most recent EARLIER workout per exercise
  // (strictly before today, so the workout being edited is never its own
  // "last time").
  const [exercises, workout, bodyWeightRecord, lastTimeAll] = await Promise.all([
    getExercisesForUser(user.id),
    getWorkoutByDate(user.id, today),
    // The user's saved body weight lives on the user, not the workout. This
    // read is also this page's "does the user still exist" check, so the
    // session cookie doesn't need a separate lookup on every request.
    getUserBodyWeightRecord(user.id),
    getLastWorkoutDataForExercises(user.id, today),
  ]);

  // Valid cookie, but the user row is gone: treat as signed out. /login
  // verifies against the database, so this can't redirect back here.
  if (!bodyWeightRecord) redirect("/login");

  // Only expose "last time" for exercises the user still has (the query is
  // keyed by user, so it can also return ids of since-deleted exercises).
  const exerciseIds = new Set(exercises.map((exercise) => exercise.id));
  const lastTimeByExerciseId: Record<string, LastExerciseSession> = {};
  for (const [exerciseId, session] of Object.entries(lastTimeAll)) {
    if (exerciseIds.has(exerciseId)) lastTimeByExerciseId[exerciseId] = session;
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-5 sm:py-10 lg:px-8 lg:py-14">
      <WorkoutPage
        initialWorkout={workout}
        userExercises={exercises}
        lastTimeByExerciseId={lastTimeByExerciseId}
        initialBodyWeight={bodyWeightRecord.bodyWeight}
        todayDisplayDate={formatDate(today, locale)}
      />
    </div>
  );
}
