import type { Metadata } from "next";

import { WorkoutPage } from "@/components/workout/workout-page";
import { getCurrentUser } from "@/lib/auth/dal";
import { getTodayDateString } from "@/lib/date";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getWorkoutByDate } from "@/lib/storage/workouts";
import { getTranslations } from "@/lib/i18n/get-translations";
import { formatDate } from "@/lib/i18n/format";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.workout.pageTitle} · GymTracker` };
}

export default async function TreniruotePage() {
  const [user, { locale }] = await Promise.all([getCurrentUser(), getTranslations()]);
  const today = getTodayDateString();

  const [exercises, workout] = user
    ? await Promise.all([
        getExercisesForUser(user.id),
        getWorkoutByDate(user.id, today),
      ])
    : [[], null];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <WorkoutPage
        initialWorkout={workout}
        userExercises={exercises}
        todayDisplayDate={formatDate(today, locale)}
      />
    </div>
  );
}
