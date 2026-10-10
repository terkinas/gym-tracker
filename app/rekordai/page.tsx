import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, Trophy } from "lucide-react";

import { RecordCard, TopRecordCard } from "@/components/records/record-card";
import { SectionHeading } from "@/components/progress/section-heading";
import { CategoryTile, categoryMeta } from "@/components/workout/workout-ui";
import { getCurrentUser } from "@/lib/auth/dal";
import { EXERCISE_CATEGORIES } from "@/lib/exercises";
import { translateCategory } from "@/lib/i18n/categories";
import { cn } from "@/lib/utils";
import { formatCount, pluralizeThree } from "@/lib/i18n/format";
import { getTranslations } from "@/lib/i18n/get-translations";
import { calculatePersonalRecords } from "@/lib/progress/analytics";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getWorkoutsForAnalytics } from "@/lib/storage/workouts";

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
    getWorkoutsForAnalytics(user.id),
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

  // Presentation only: highlight the heaviest lifts and group the rows (already
  // sorted by category) under category headings. No values are recomputed.
  const top = rows
    .filter((exercise) => records.get(exercise.id)!.bestWeight > 0)
    .sort((a, b) => records.get(b.id)!.bestWeight - records.get(a.id)!.bestWeight)
    .slice(0, 3);
  const groups = rows.reduce<{ category: (typeof rows)[number]["category"]; items: typeof rows }[]>(
    (acc, exercise) => {
      const last = acc[acc.length - 1];
      if (last && last.category === exercise.category) last.items.push(exercise);
      else acc.push({ category: exercise.category, items: [exercise] });
      return acc;
    },
    [],
  );
  let cardIndex = 0;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <header className="mb-6 flex flex-col gap-1 sm:mb-8">
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          <Trophy className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="truncate">
            {rows.length > 0
              ? `${formatCount(rows.length, locale)} ${pluralizeThree(locale, rows.length, t.history.exercisesWord)}`
              : t.records.pageTitle}
          </span>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t.records.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.records.pageSubtitle}</p>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-none border border-dashed border-border px-5 py-16 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-none border border-border bg-muted/30 text-muted-foreground"
          >
            <Trophy className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t.records.emptyState.title}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t.records.emptyState.description}
            </p>
          </div>
          <Link
            href="/treniruote"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-none border border-input px-5 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Dumbbell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {t.records.emptyState.cta}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-9">
          {rows.length > 3 && top.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="top-records-title">
              <SectionHeading
                id="top-records-title"
                icon={Trophy}
                tone="amber"
                title={t.records.top.title}
                subtitle={t.records.top.description}
              />
              <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {top.map((exercise, i) => (
                  <TopRecordCard
                    key={exercise.id}
                    exercise={exercise}
                    record={records.get(exercise.id)!}
                    rank={i + 1}
                    t={t}
                    locale={locale}
                  />
                ))}
              </ol>
            </section>
          )}

          {groups.map((group) => (
            <section
              key={group.category}
              className="flex flex-col gap-3.5"
              aria-label={translateCategory(group.category, t)}
            >
              <h2 className="flex items-center gap-3 text-lg font-semibold tracking-tight text-foreground">
                <CategoryTile category={group.category} className="h-9 w-9" />
                {translateCategory(group.category, t)}
                <span className="rounded-none border border-border/60 bg-muted/30 px-2 py-0.5 text-xs leading-4 font-medium text-muted-foreground tabular-nums">
                  {formatCount(group.items.length, locale)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px flex-1 bg-gradient-to-r to-transparent",
                    categoryMeta(group.category).line,
                  )}
                />
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                {group.items.map((exercise) => (
                  <RecordCard
                    key={exercise.id}
                    exercise={exercise}
                    record={records.get(exercise.id)!}
                    t={t}
                    locale={locale}
                    index={cardIndex++}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
