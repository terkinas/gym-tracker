import type { Metadata } from "next";

import { ExerciseList } from "@/components/exercises/exercise-list";
import { getCurrentUser } from "@/lib/auth/dal";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getTranslations } from "@/lib/i18n/get-translations";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.exercises.pageTitle} · GymTracker` };
}

export default async function PratimaiPage() {
  const user = await getCurrentUser();
  const exercises = user ? await getExercisesForUser(user.id) : [];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <ExerciseList initialExercises={exercises} />
    </div>
  );
}
