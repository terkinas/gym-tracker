import { Award, Dumbbell, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { YouBadge, formatEntry } from "@/components/leaderboard/leaderboard-row";
import {
  ProgressIcon,
  RankMark,
  ScoreMeter,
  UserAvatar,
  progressChip,
  rankAccent,
} from "@/components/leaderboard/leaderboard-ui";
import type { LeaderboardEntry } from "@/lib/progress/analytics";
import type { Locale } from "@/lib/i18n/config";
import { formatCount } from "@/lib/i18n/format";
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

function StatRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </dt>
      <dd className="shrink-0 text-sm font-semibold text-foreground tabular-nums">{children}</dd>
    </div>
  );
}

/** Top 3 as cards: stacked on mobile, a subtle podium (#1 raised and larger)
 * on desktop. Gold / silver / bronze gradient accents. Pure presentation of
 * already-ranked entries. */
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
              "relative flex flex-col gap-4 overflow-hidden rounded-none border bg-card p-4 pt-5 sm:p-5 sm:pt-6",
              "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 motion-safe:fill-mode-backwards",
              DESKTOP_ORDER[entry.rank],
              isFirst && "md:pb-7",
              accent?.card,
              entry.isCurrentUser && "border-primary/50 ring-1 ring-primary/30",
            )}
          >
            <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1", accent?.line)} />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-10 -right-10 h-32 w-32 blur-2xl",
                accent?.glow,
              )}
            />

            <div className="relative flex items-center gap-3">
              <RankMark rank={entry.rank} className="h-10 w-10 rounded-none" />
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

            <div className="relative flex flex-col gap-2">
              <span className="flex items-baseline gap-2">
                <TrendingUp
                  className="h-5 w-5 shrink-0 self-center text-primary"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "leading-none font-bold tracking-tight text-foreground tabular-nums",
                    isFirst ? "text-4xl" : "text-3xl",
                  )}
                >
                  {f.score}
                </span>
                <span className="text-sm text-muted-foreground">{t.leaderboard.pts}</span>
              </span>
              <ScoreMeter score={entry.score} />
            </div>

            <dl className="relative flex flex-col divide-y divide-border/60 rounded-none border border-border/60 bg-muted/20 px-3">
              <StatRow
                icon={<ProgressIcon pct={entry.progressPct} className="h-3.5 w-3.5 shrink-0" />}
                label={t.leaderboard.columns.progress}
              >
                <span
                  className={cn(
                    "inline-flex items-center rounded-none border px-1.5 py-0.5 text-xs",
                    progressChip(entry.progressPct),
                  )}
                >
                  {f.progress}
                </span>
              </StatRow>
              <StatRow
                icon={<Dumbbell className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                label={t.leaderboard.columns.workouts}
              >
                {formatCount(entry.workouts, locale)}
              </StatRow>
              <StatRow
                icon={<Award className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
                label={t.leaderboard.columns.prs}
              >
                {formatCount(entry.prs, locale)}
              </StatRow>
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
