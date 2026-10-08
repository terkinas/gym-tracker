import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  Hand,
  Layers3,
  PersonStanding,
} from "lucide-react";

import { CategoryTile, StatusBadge, categoryMeta } from "@/components/workout/workout-ui";
import { getCurrentUser } from "@/lib/auth/dal";
import { getWorkoutStats } from "@/lib/history/stats";
import { translateCategory } from "@/lib/i18n/categories";
import { formatCount, formatDate, pluralizeThree } from "@/lib/i18n/format";
import { getTranslations } from "@/lib/i18n/get-translations";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getWorkoutByIdForUser } from "@/lib/storage/workouts";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.history.detailTitle} · GymTracker` };
}

function SummaryTile({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Dumbbell;
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-border bg-card px-4 py-3.5">
      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      <span className="text-2xl leading-none font-semibold text-foreground tabular-nums">
        {value}
      </span>
      <span className="truncate text-xs text-muted-foreground">{label}</span>
    </div>
  );
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
  // Both lookups are independent, so run them in parallel (one DB round trip
  // instead of two).
  const [workout, exercises] = await Promise.all([
    getWorkoutByIdForUser(user.id, id),
    getExercisesForUser(user.id),
  ]);
  if (!workout) notFound();
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const stats = getWorkoutStats(workout);
  // Presentation only: every logged exercise was marked "done".
  const allDone = workout.exercises.length > 0 && workout.exercises.every((e) => e.completed);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <Link
        href={`/istorija?month=${workout.date.slice(0, 7)}`}
        className="mb-4 -ml-3 inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        {t.history.backToHistory}
      </Link>

      <header className="mb-6 flex flex-col gap-1 sm:mb-8">
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {t.history.detailTitle}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {formatDate(workout.date, locale)}
          </h1>
          {allDone && (
            <StatusBadge icon={Check} className="border-primary/30 bg-primary/10 text-primary">
              {t.workout.doneBadge}
            </StatusBadge>
          )}
        </div>
      </header>

      <section className="mb-8 grid grid-cols-3 gap-2.5 sm:gap-3">
        <SummaryTile
          icon={Dumbbell}
          value={formatCount(stats.exerciseCount, locale)}
          label={pluralizeThree(locale, stats.exerciseCount, t.history.exercisesWord)}
        />
        <SummaryTile
          icon={Layers3}
          value={formatCount(stats.setCount, locale)}
          label={pluralizeThree(locale, stats.setCount, t.history.setsWord)}
        />
        <SummaryTile
          icon={Flame}
          value={formatCount(stats.hardSetCount, locale)}
          label={t.history.hardSets}
        />
      </section>

      <div className="flex flex-col gap-4">
        {workout.exercises.map((entry, index) => {
          const exercise = exerciseById.get(entry.exerciseId);
          const oneHanded = exercise?.isOneHanded === true;
          const cols = oneHanded
            ? "grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]"
            : "grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem]";
          return (
            <article
              key={`${entry.exerciseId}-${index}`}
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:fill-mode-backwards sm:p-5"
            >
              <span
                aria-hidden="true"
                className={cn("absolute inset-y-0 left-0 w-1", categoryMeta(exercise?.category).bar)}
              />

              <div className="flex min-w-0 items-start gap-3">
                <CategoryTile category={exercise?.category} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <h2 className="text-base font-semibold break-words text-foreground">
                    {exercise?.name ?? t.history.unknownExercise}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {exercise && (
                      <span className="text-xs text-muted-foreground">
                        {translateCategory(exercise.category, t)}
                      </span>
                    )}
                    {oneHanded && <StatusBadge icon={Hand}>{t.workout.oneHandedBadge}</StatusBadge>}
                    {entry.usesBodyweight && (
                      <StatusBadge icon={PersonStanding}>{t.workout.bodyWeight.label}</StatusBadge>
                    )}
                    {entry.completed && (
                      <StatusBadge icon={Check} className="text-primary/80">
                        {t.workout.doneBadge}
                      </StatusBadge>
                    )}
                  </div>
                </div>
              </div>

              {entry.sets.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">{t.workout.noSetsYet}</p>
              ) : (
                <div className="mt-4 flex flex-col rounded-xl border border-border/60 bg-muted/20 px-3">
                  <div
                    className={`grid ${cols} items-center gap-2 border-b border-border/60 py-2 text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase sm:gap-3`}
                  >
                    <span>#</span>
                    <span className="truncate">
                      {entry.usesBodyweight
                        ? t.workout.bodyweightExercise.extraHeader
                        : t.history.columns.weight}
                    </span>
                    <span className="truncate">{t.history.columns.reps}</span>
                    {oneHanded && <span className="truncate">{t.workout.hand.label}</span>}
                    <span className="truncate text-center">{t.history.columns.hard}</span>
                  </div>
                  {entry.sets.map((set, setIndex) => (
                    <div
                      key={set.id}
                      className={`grid ${cols} items-center gap-2 border-b border-border/40 py-2.5 text-sm text-foreground tabular-nums last:border-b-0 sm:gap-3`}
                    >
                      <span className="text-muted-foreground">{setIndex + 1}</span>
                      <span className="font-medium">{formatCount(set.weight, locale)} kg</span>
                      <span>{formatCount(set.reps, locale)}</span>
                      {oneHanded && (
                        <span className="truncate text-muted-foreground">
                          {set.hand ? t.workout.hand[set.hand] : "—"}
                        </span>
                      )}
                      <span className="flex justify-center">
                        {set.isHardSet ? (
                          <>
                            <Flame
                              className="h-4 w-4 text-primary"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                            <span className="sr-only">{t.history.columns.hard}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/60" aria-hidden="true">
                            —
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
