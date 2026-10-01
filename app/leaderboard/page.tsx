import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Info, Medal } from "lucide-react";

import { LeaderboardPeriodTabs } from "@/components/leaderboard/leaderboard-period-tabs";
import { LEADERBOARD_GRID, LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatCount } from "@/lib/i18n/format";
import { getTranslations } from "@/lib/i18n/get-translations";
import { LEADERBOARD_TOP_N, parseScorePeriod } from "@/lib/progress/analytics";
import { getLeaderboard } from "@/lib/storage/leaderboard";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: `${t.leaderboard.pageTitle} · GymTracker` };
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  // The proxy already protects this route; never rely on that alone.
  if (!user) redirect("/login");

  const [{ t, locale }, params] = await Promise.all([getTranslations(), searchParams]);
  // Unknown / missing ?period falls back to the 30-day default.
  const period = parseScorePeriod(params.period);

  // The viewer's id comes from the server session only. Everything is
  // computed server-side and only public fields come back.
  const board = await getLeaderboard(period, user.id);
  const showOwnRowBelow = board.me !== null && board.me.rank > LEADERBOARD_TOP_N;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t.leaderboard.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.leaderboard.pageSubtitle}</p>
        </div>
        <LeaderboardPeriodTabs value={period} t={t} />
      </div>

      {board.participants === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-border px-5 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Medal className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t.leaderboard.emptyState.title}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t.leaderboard.emptyState.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <div
              aria-hidden="true"
              className={`hidden px-4 text-xs font-medium text-muted-foreground ${LEADERBOARD_GRID}`}
            >
              <span>#</span>
              <span>{t.leaderboard.columns.name}</span>
              <span className="text-right">{t.leaderboard.columns.score}</span>
              <span className="text-right">{t.leaderboard.columns.progress}</span>
              <span className="text-right">{t.leaderboard.columns.workouts}</span>
              <span className="text-right">{t.leaderboard.columns.prs}</span>
            </div>

            <ol className="flex flex-col gap-2">
              {board.top.map((entry) => (
                <LeaderboardRow key={entry.rank} entry={entry} t={t} locale={locale} />
              ))}
            </ol>

            <p className="text-xs text-muted-foreground">
              {t.leaderboard.participants(board.participants)}
            </p>
          </section>

          {showOwnRowBelow && board.me && (
            <section className="flex flex-col gap-3" aria-label={t.leaderboard.yourPosition}>
              <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-foreground">
                {t.leaderboard.yourPosition}
                <span className="text-primary tabular-nums">#{formatCount(board.me.rank, locale)}</span>
              </h2>
              <ol className="flex flex-col">
                <LeaderboardRow entry={board.me} t={t} locale={locale} />
              </ol>
            </section>
          )}

          {board.me === null && (
            <section className="flex flex-col gap-1 rounded-lg border border-dashed border-border px-5 py-5">
              <h2 className="text-base font-semibold text-foreground">{t.leaderboard.notRanked.title}</h2>
              <p className="text-sm text-muted-foreground">{t.leaderboard.notRanked.description}</p>
            </section>
          )}
        </div>
      )}

      <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span>{t.leaderboard.note}</span>
      </p>
    </div>
  );
}
