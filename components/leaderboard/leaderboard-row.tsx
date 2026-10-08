import { Award, BadgeCheck, Dumbbell, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ProgressIcon,
  RankMark,
  ScoreMeter,
  UserAvatar,
  progressTone,
} from "@/components/leaderboard/leaderboard-ui";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/progress/analytics";
import type { Locale } from "@/lib/i18n/config";
import { formatCount, formatSignedPercent, pluralizeThree } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/translations";

/** Shared grid for the header and rows (md and up). `minmax(0, …)` on the
 * name column lets long names truncate instead of widening the page. */
export const LEADERBOARD_GRID =
  "md:grid md:grid-cols-[3rem_minmax(0,1fr)_10rem_6rem_8rem_5rem] md:items-center md:gap-4";

/** Display strings for one entry (presentation only; values come from the
 * existing ranking untouched). */
export function formatEntry(entry: LeaderboardEntry, t: Dictionary, locale: Locale) {
  return {
    score: formatCount(entry.score, locale),
    progress: entry.progressPct === null ? "—" : formatSignedPercent(entry.progressPct, locale),
    workouts: `${formatCount(entry.workouts, locale)} ${pluralizeThree(locale, entry.workouts, t.leaderboard.workoutsWord)}`,
    prs: `${formatCount(entry.prs, locale)} ${pluralizeThree(locale, entry.prs, t.leaderboard.prWord)}`,
  };
}

export function YouBadge({ t }: { t: Dictionary }) {
  return (
    <Badge className="gap-1 border-primary/40 bg-primary/10 px-2 py-0 text-[0.7rem] leading-5 text-primary">
      <BadgeCheck className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
      {t.leaderboard.you}
    </Badge>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  t: Dictionary;
  locale: Locale;
  /** Position in the list, only used to stagger the entrance a little. */
  index?: number;
}

/** One ranked user. Only public fields ever reach this component. Mobile:
 * rank + name + score on top, secondary metrics underneath. Desktop: columns
 * inside a single dashboard-style card. */
export function LeaderboardRow({ entry, t, locale, index = 0 }: LeaderboardRowProps) {
  const f = formatEntry(entry, t, locale);
  const tone = progressTone(entry.progressPct);

  const nameBlock = (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate font-medium text-foreground">{entry.name}</span>
      {entry.isCurrentUser && <YouBadge t={t} />}
    </span>
  );

  const scoreBlock = (
    <span className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-baseline gap-1.5">
        <TrendingUp className="h-4 w-4 shrink-0 self-center text-primary" strokeWidth={1.75} aria-hidden="true" />
        <span className="text-xl leading-none font-semibold text-foreground tabular-nums">{f.score}</span>
        <span className="text-xs text-muted-foreground">{t.leaderboard.pts}</span>
      </span>
      <ScoreMeter score={entry.score} />
    </span>
  );

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card px-4 py-3.5 transition-colors duration-200 md:rounded-none md:border-0 md:py-3",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:fill-mode-backwards",
        entry.isCurrentUser ? "border-primary/40 bg-primary/5" : "border-border hover:bg-accent/30",
        LEADERBOARD_GRID,
      )}
    >
      {entry.isCurrentUser && (
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary/60" />
      )}

      {/* Mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center gap-3">
          <RankMark rank={entry.rank} />
          <UserAvatar name={entry.name} highlighted={entry.isCurrentUser} className="h-9 w-9" />
          <span className="min-w-0 flex-1">{nameBlock}</span>
          <span className="flex shrink-0 items-baseline gap-1">
            <span className="text-xl leading-none font-semibold text-foreground tabular-nums">{f.score}</span>
            <span className="text-xs text-muted-foreground">{t.leaderboard.pts}</span>
          </span>
        </div>
        <ScoreMeter score={entry.score} />
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className={cn("inline-flex items-center gap-1 font-medium tabular-nums", tone)}>
            <ProgressIcon pct={entry.progressPct} className="h-3.5 w-3.5" />
            {f.progress}
          </span>
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {f.workouts}
          </span>
          <span className="inline-flex items-center gap-1">
            <Award className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {f.prs}
          </span>
        </p>
      </div>

      {/* Desktop */}
      <span className="hidden md:flex">
        <RankMark rank={entry.rank} />
      </span>
      <span className="hidden min-w-0 items-center gap-3 md:flex">
        <UserAvatar name={entry.name} highlighted={entry.isCurrentUser} />
        <span className="min-w-0 flex-1">{nameBlock}</span>
      </span>
      <span className="hidden md:block">{scoreBlock}</span>
      <span className={cn("hidden items-center justify-end gap-1 font-medium tabular-nums md:flex", tone)}>
        <ProgressIcon pct={entry.progressPct} className="h-4 w-4" />
        {f.progress}
      </span>
      <span className="hidden items-center justify-end gap-1.5 text-sm text-muted-foreground tabular-nums md:flex">
        <Dumbbell className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {f.workouts}
      </span>
      <span className="hidden items-center justify-end gap-1.5 text-sm text-muted-foreground tabular-nums md:flex">
        <Award className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {f.prs}
      </span>
    </li>
  );
}
