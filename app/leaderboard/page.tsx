import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Info, Trophy, User } from "lucide-react";

import { LeaderboardPeriodTabs } from "@/components/leaderboard/leaderboard-period-tabs";
import { LeaderboardPodium } from "@/components/leaderboard/leaderboard-podium";
import { LEADERBOARD_GRID, LeaderboardRow } from "@/components/leaderboard/leaderboard-row";
import { YourPositionCard } from "@/components/leaderboard/your-position-card";
import { getCurrentUser } from "@/lib/auth/dal";
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

  const podium = board.top.slice(0, 3);
  const rest = board.top.slice(3);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 lg:px-8 lg:py-14">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            <Trophy className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">
              {t.progress.timeRanges[period]}
              {board.participants > 0 && ` · ${t.leaderboard.participants(board.participants)}`}
            </span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t.leaderboard.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.leaderboard.pageSubtitle}</p>
        </div>
        <LeaderboardPeriodTabs value={period} t={t} />
      </header>

      {board.participants === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border px-5 py-16 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground"
          >
            <Trophy className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t.leaderboard.emptyState.title}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t.leaderboard.emptyState.description}
            </p>
          </div>
          <Link
            href="/treniruote"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input px-5 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Dumbbell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {t.leaderboard.emptyState.cta}
          </Link>
        </div>
      ) : (
        <div key={period} className="flex flex-col gap-6 sm:gap-8">
          <LeaderboardPodium entries={podium} t={t} locale={locale} />

          {rest.length > 0 && (
            <div className="md:overflow-hidden md:rounded-2xl md:border md:border-border md:bg-card">
              <div
                aria-hidden="true"
                className={`hidden border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground ${LEADERBOARD_GRID}`}
              >
                <span>#</span>
                <span>{t.leaderboard.columns.name}</span>
                <span>{t.leaderboard.columns.score}</span>
                <span className="text-right">{t.leaderboard.columns.progress}</span>
                <span className="text-right">{t.leaderboard.columns.workouts}</span>
                <span className="text-right">{t.leaderboard.columns.prs}</span>
              </div>
              <ol className="flex flex-col gap-2 md:gap-0 md:divide-y md:divide-border">
                {rest.map((entry, index) => (
                  <LeaderboardRow key={entry.rank} entry={entry} t={t} locale={locale} index={index} />
                ))}
              </ol>
            </div>
          )}

          {showOwnRowBelow && board.me && (
            <YourPositionCard entry={board.me} t={t} locale={locale} />
          )}

          {board.me === null && (
            <section className="flex items-start gap-3 rounded-2xl border border-dashed border-border px-4 py-4 sm:px-5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground"
              >
                <User className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-base font-semibold text-foreground">{t.leaderboard.notRanked.title}</h2>
                <p className="text-sm text-muted-foreground">{t.leaderboard.notRanked.description}</p>
              </div>
            </section>
          )}
        </div>
      )}

      <aside className="mt-8 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-sm font-medium text-foreground">{t.leaderboard.info.title}</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.leaderboard.info.description}</p>
        </div>
      </aside>
    </div>
  );
}
