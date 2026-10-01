import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/progress/analytics";
import type { Locale } from "@/lib/i18n/config";
import { formatCount, formatSignedPercent, pluralizeThree } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/translations";

/** Shared grid for the header and rows (md and up). `minmax(0, …)` on the
 * name column lets long names truncate instead of widening the page. */
export const LEADERBOARD_GRID =
  "md:grid md:grid-cols-[3rem_minmax(0,1fr)_7rem_6rem_8rem_5rem] md:items-center md:gap-4";

function progressTone(pct: number | null) {
  if (pct === null) return "text-muted-foreground";
  if (pct > 0) return "text-primary";
  if (pct < 0) return "text-destructive";
  return "text-muted-foreground";
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  t: Dictionary;
  locale: Locale;
}

/** One ranked user. Only public fields ever reach this component (name, rank,
 * score, progress %, workouts, PRs). Mobile: compact two-line row. Desktop:
 * table-like columns. */
export function LeaderboardRow({ entry, t, locale }: LeaderboardRowProps) {
  const progress = entry.progressPct === null ? "—" : formatSignedPercent(entry.progressPct, locale);
  const workouts = `${formatCount(entry.workouts, locale)} ${pluralizeThree(locale, entry.workouts, t.leaderboard.workoutsWord)}`;
  const prs = `${formatCount(entry.prs, locale)} ${pluralizeThree(locale, entry.prs, t.leaderboard.prWord)}`;
  const score = `${formatCount(entry.score, locale)} ${t.leaderboard.pts}`;

  const rankBadge = (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
        entry.rank <= 3 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {entry.rank}
    </span>
  );

  const nameBlock = (
    <span className="flex min-w-0 items-center gap-2">
      <span className="truncate font-medium text-foreground">{entry.name}</span>
      {entry.isCurrentUser && (
        <Badge className="border-primary/40 bg-primary/10 text-primary">{t.leaderboard.you}</Badge>
      )}
    </span>
  );

  return (
    <li
      className={cn(
        "rounded-lg border bg-card px-4 py-3",
        entry.isCurrentUser ? "border-primary/50 bg-primary/5" : "border-border",
        LEADERBOARD_GRID,
      )}
    >
      {/* Mobile: compact rows */}
      <div className="flex flex-col gap-1.5 md:hidden">
        <div className="flex items-center gap-3">
          {rankBadge}
          <span className="min-w-0 flex-1">{nameBlock}</span>
          <span className="shrink-0 text-base font-semibold text-foreground tabular-nums">{score}</span>
        </div>
        <p className="flex flex-wrap gap-x-3 gap-y-0.5 pl-11 text-xs text-muted-foreground">
          <span className={cn("font-medium tabular-nums", progressTone(entry.progressPct))}>{progress}</span>
          <span>{workouts}</span>
          <span>{prs}</span>
        </p>
      </div>

      {/* Desktop: columns */}
      <span className="hidden md:flex">{rankBadge}</span>
      <span className="hidden min-w-0 md:block">{nameBlock}</span>
      <span className="hidden text-right font-semibold text-foreground tabular-nums md:block">{score}</span>
      <span className={cn("hidden text-right font-medium tabular-nums md:block", progressTone(entry.progressPct))}>
        {progress}
      </span>
      <span className="hidden text-right text-sm text-muted-foreground tabular-nums md:block">{workouts}</span>
      <span className="hidden text-right text-sm text-muted-foreground tabular-nums md:block">{prs}</span>
    </li>
  );
}
