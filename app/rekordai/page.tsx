import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";

import { RecordCard } from "@/components/records/record-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import { getTranslations } from "@/lib/i18n/get-translations";
import { calculatePersonalRecords } from "@/lib/progress/analytics";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getWorkoutsForUser } from "@/lib/storage/workouts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.records.pageTitle} · GymTracker` };
}

export default async function RecordsPage() {
  const user = await getCurrentUser();
  // The proxy already protects this route; never rely on that alone.
  if (!user) redirect("/login");

  const { t, locale } = await getTranslations();

  // userId comes from the server session only. Records are derived on every
  // request from the user's saved workouts — nothing is cached or stored.
  const [workouts, exercises] = await Promise.all([
    getWorkoutsForUser(user.id),
    getExercisesForUser(user.id),
  ]);
  const records = calculatePersonalRecords(workouts);

  // Only exercises that still exist (a deleted exercise has no name to show),
  // ordered by category then name.
  const rows = exercises
    .filter((exercise) => records.has(exercise.id))
    .sort(
      (a, b) =>
        EXERCISE_CATEGORIES.indexOf(a.category) - EXERCISE_CATEGORIES.indexOf(b.category) ||
        a.name.localeCompare(b.name, locale),
    );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t.records.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.records.pageSubtitle}</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border px-5 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Trophy className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t.records.emptyState.title}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t.records.emptyState.description}
            </p>
          </div>
          <Button asChild>
            <Link href="/treniruote">{t.records.emptyState.cta}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((exercise) => (
            <RecordCard
              key={exercise.id}
              exercise={exercise}
              record={records.get(exercise.id)!}
              t={t}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
