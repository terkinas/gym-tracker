import Link from "next/link";

import { cn } from "@/lib/utils";
import { SCORE_PERIOD_VALUES } from "@/lib/progress/analytics";
import type { ScorePeriod } from "@/lib/progress/analytics";
import type { Dictionary } from "@/lib/i18n/translations";

/** `7D | 30D | 90D` switcher. Plain links to `?period=…` so the period lives in
 * the URL and the leaderboard is recomputed server-side on each change —
 * no client state, no userId or scores ever come from the client. */
export function LeaderboardPeriodTabs({ value, t }: { value: ScorePeriod; t: Dictionary }) {
  return (
    <nav
      aria-label={t.leaderboard.periodAria}
      className="inline-flex gap-1 rounded-md border border-border bg-card p-1"
    >
      {SCORE_PERIOD_VALUES.map((period) => (
        <Link
          key={period}
          href={`/leaderboard?period=${period}`}
          aria-current={value === period ? "page" : undefined}
          title={t.progress.timeRanges[period]}
          className={cn(
            "min-w-12 rounded-sm px-3 py-1.5 text-center text-sm font-medium transition-colors",
            value === period
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.leaderboard.periods[period]}
        </Link>
      ))}
    </nav>
  );
}
