import { Award, Dumbbell, TrendingUp } from "lucide-react";

import { YouBadge, formatEntry } from "@/components/leaderboard/leaderboard-row";
import {
  ProgressIcon,
  RankMark,
  ScoreMeter,
  UserAvatar,
  progressTone,
  rankAccent,
} from "@/components/leaderboard/leaderboard-ui";
import type { LeaderboardEntry } from "@/lib/progress/analytics";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

// Desktop visual order puts #1 in the middle; mobile keeps 1 → 2 → 3.
const DESKTOP_ORDER: Record<number, string> = {
  1: "md:order-2",
  2: "md:order-1",
  3: "md:order-3",
};

const COLUMNS: Record<number, string> = {
  1: "md:mx-auto md:max-w-sm md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

interface PodiumProps {
  entries: LeaderboardEntry[];
  t: Dictionary;
  locale: Locale;
}

/** Top 3 as cards: stacked on mobile, a subtle podium (#1 raised and larger)
 * on desktop. Pure presentation of already-ranked entries. */
export function LeaderboardPodium({ entries, t, locale }: PodiumProps) {
  if (entries.length === 0) return null;

  return (
    <ol className={cn("grid grid-cols-1 gap-3 md:items-end md:gap-4", COLUMNS[entries.length])}>
      {entries.map((entry, index) => {
        const accent = rankAccent(entry.rank);
        const f = formatEntry(entry, t, locale);
        const isFirst = entry.rank === 1;

        return (
          <li
            key={entry.rank}
            style={{ animationDelay: `${index * 50}ms` }}
            className={cn(
              "relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-4 pt-5 sm:p-5 sm:pt-6",
              "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:fill-mode-backwards",
              DESKTOP_ORDER[entry.rank],
              isFirst && "md:pb-7",
              entry.isCurrentUser ? "border-primary/40 bg-primary/5" : "border-border",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("absolute inset-x-0 top-0 h-1", accent?.line)}
            />

            <div className="flex items-center gap-3">
              <RankMark rank={entry.rank} className="h-10 w-10 rounded-xl" />
              <UserAvatar
                name={entry.name}
                highlighted={entry.isCurrentUser}
                className={isFirst ? "h-11 w-11 text-sm" : undefined}
              />
              <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                <span className="w-full truncate text-base font-semibold text-foreground">
                  {entry.name}
                </span>
                {entry.isCurrentUser && <YouBadge t={t} />}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="flex items-baseline gap-2">
                <TrendingUp
                  className="h-5 w-5 shrink-0 self-center text-primary"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "leading-none font-semibold tracking-tight text-foreground tabular-nums",
                    isFirst ? "text-4xl" : "text-3xl",
                  )}
                >
                  {f.score}
                </span>
                <span className="text-sm text-muted-foreground">{t.leaderboard.pts}</span>
              </span>
              <ScoreMeter score={entry.score} />
            </div>

            <dl className="grid grid-cols-1 gap-x-3 gap-y-1.5 text-xs text-muted-foreground min-[400px]:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t.leaderboard.columns.progress}</dt>
                <dd className={cn("inline-flex items-center gap-1 font-medium tabular-nums", progressTone(entry.progressPct))}>
                  <ProgressIcon pct={entry.progressPct} className="h-3.5 w-3.5" />
                  {f.progress}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t.leaderboard.columns.workouts}</dt>
                <dd className="inline-flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {f.workouts}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{t.leaderboard.columns.prs}</dt>
                <dd className="inline-flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  {f.prs}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
