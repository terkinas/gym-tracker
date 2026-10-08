import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WorkoutPage } from "@/components/workout/workout-page";
import { getCurrentUser } from "@/lib/auth/dal";
import { getTodayDateString } from "@/lib/date";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getUserBodyWeight } from "@/lib/storage/users";
import { getLastWorkoutDataForExercises, getWorkoutByDate } from "@/lib/storage/workouts";
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

  const [exercises, workout, bodyWeight] = user
    ? await Promise.all([
        getExercisesForUser(user.id),
        getWorkoutByDate(user.id, today),
        // The user's saved body weight lives on the user, not the workout.
        getUserBodyWeight(user.id),
      ])
    : [[], null, null];

  // "Last time" is informational only: one batched, user-scoped lookup of the
  // most recent EARLIER workout per exercise (strictly before today, so the
  // workout being edited is never its own "last time").
  const lastTimeByExerciseId = user
    ? await getLastWorkoutDataForExercises(
        user.id,
        exercises.map((exercise) => exercise.id),
        today,
      )
    : {};

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-5 sm:py-10 lg:px-8 lg:py-14">
      <WorkoutPage
        initialWorkout={workout}
        userExercises={exercises}
        lastTimeByExerciseId={lastTimeByExerciseId}
        initialBodyWeight={bodyWeight}
        todayDisplayDate={formatDate(today, locale)}
      />
    </div>
  );
}
