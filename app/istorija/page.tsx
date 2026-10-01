import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { History } from "lucide-react";

import { HistoryCard } from "@/components/history/history-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";
import { getTranslations } from "@/lib/i18n/get-translations";
import { getExercisesForUser } from "@/lib/storage/exercises";
import { getWorkoutHistoryForUser } from "@/lib/storage/workouts";

const PAGE_SIZE = 20;
const MAX_LIMIT = 500;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.history.pageTitle} · GymTracker` };
}

function parseLimit(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(n) || n < PAGE_SIZE) return PAGE_SIZE;
  return Math.min(n, MAX_LIMIT);
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  // The proxy already protects this route; never rely on that alone.
  if (!user) redirect("/login");

  const [{ t, locale }, params] = await Promise.all([getTranslations(), searchParams]);
  const limit = parseLimit(params.limit);

  // userId always comes from the server session, never from the client.
  const [{ workouts, hasMore }, exercises] = await Promise.all([
    getWorkoutHistoryForUser(user.id, limit),
    getExercisesForUser(user.id),
  ]);
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t.history.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.history.pageSubtitle}</p>
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border px-5 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <History className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t.history.emptyState.title}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t.history.emptyState.description}
            </p>
          </div>
          <Button asChild>
            <Link href="/treniruote">{t.history.emptyState.cta}</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((workout) => (
            <HistoryCard
              key={workout.id}
              workout={workout}
              exerciseById={exerciseById}
              t={t}
              locale={locale}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button asChild variant="outline">
                <Link href={`/istorija?limit=${limit + PAGE_SIZE}`} scroll={false}>
                  {t.history.loadMore}
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
