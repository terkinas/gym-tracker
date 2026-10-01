import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";
import { getWorkoutStats } from "@/lib/history/stats";
import { translateCategory } from "@/lib/i18n/categories";
import { formatCount, formatDate, formatVolume, pluralizeThree } from "@/lib/i18n/format";
import { getTranslations } from "@/lib/i18n/get-translations";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getWorkoutByIdForUser } from "@/lib/storage/workouts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.history.detailTitle} · GymTracker` };
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ id }, { t, locale }] = await Promise.all([params, getTranslations()]);

  // Scoped by BOTH id and the session's userId: someone else's workout id
  // resolves to null and 404s instead of leaking data.
  const workout = await getWorkoutByIdForUser(user.id, id);
  if (!workout) notFound();

  const exercises = await getExercisesForUser(user.id);
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const stats = getWorkoutStats(workout);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link href="/istorija">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {t.history.backToHistory}
        </Link>
      </Button>

      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {formatDate(workout.date, locale)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatCount(stats.exerciseCount, locale)}{" "}
          {pluralizeThree(locale, stats.exerciseCount, t.history.exercisesWord)} ·{" "}
          {formatCount(stats.setCount, locale)}{" "}
          {pluralizeThree(locale, stats.setCount, t.history.setsWord)}
        </p>
        <p className="text-sm font-medium text-foreground">
          {formatVolume(stats.totalVolume, locale)} {t.history.totalVolume}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {workout.exercises.map((entry, index) => {
          const exercise = exerciseById.get(entry.exerciseId);
          return (
            <Card key={`${entry.exerciseId}-${index}`} className="gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-base font-semibold break-words text-foreground">
                  {exercise?.name ?? t.history.unknownExercise}
                </h2>
                {exercise && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge>{translateCategory(exercise.category, t)}</Badge>
                    {exercise.isOneHanded && (
                      <Badge className="bg-transparent text-muted-foreground">
                        {t.workout.oneHandedBadge}
                      </Badge>
                    )}
                  </div>
                )}
                {exercise?.isOneHanded && (
                  <p className="text-xs text-muted-foreground">{t.workout.oneHandedHint}</p>
                )}
              </div>

              {entry.sets.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.workout.noSetsYet}</p>
              ) : (
                <div className="flex flex-col">
                  <div className={`grid ${exercise?.isOneHanded ? "grid-cols-[3rem_1fr_1fr_1fr]" : "grid-cols-[3rem_1fr_1fr]"} gap-3 border-b border-border pb-2 text-xs font-medium text-muted-foreground uppercase`}>
                    <span>{t.history.columns.set}</span>
                    <span>{t.history.columns.weight}</span>
                    <span>{t.history.columns.reps}</span>
                    {exercise?.isOneHanded && <span>{t.workout.hand.label}</span>}
                  </div>
                  {entry.sets.map((set, setIndex) => (
                    <div
                      key={set.id}
                      className={`grid ${exercise?.isOneHanded ? "grid-cols-[3rem_1fr_1fr_1fr]" : "grid-cols-[3rem_1fr_1fr]"} gap-3 border-b border-border/50 py-2 text-sm text-foreground tabular-nums last:border-b-0`}
                    >
                      <span className="text-muted-foreground">{setIndex + 1}</span>
                      <span>{formatCount(set.weight, locale)} kg</span>
                      <span>{formatCount(set.reps, locale)}</span>
                      {exercise?.isOneHanded && (
                        <span>{set.hand ? t.workout.hand[set.hand] : "—"}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
