import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { SCORE_PERIOD_VALUES } from "@/lib/progress/analytics";
import type { ScorePeriod } from "@/lib/progress/analytics";
import type { Dictionary } from "@/lib/i18n/translations";

/** `7D | 30D | 90D` segmented control. Plain links to `?period=…` so the
 * period lives in the URL and the leaderboard is recomputed server-side on
 * each change — no client state, no userId or scores ever come from the
 * client. */
export function LeaderboardPeriodTabs({ value, t }: { value: ScorePeriod; t: Dictionary }) {
  return (
    <nav
      aria-label={t.leaderboard.periodAria}
      className="flex w-full items-center gap-1 rounded-xl border border-border bg-muted/20 p-1 sm:w-fit"
    >
      <CalendarDays
        className="mx-2 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {SCORE_PERIOD_VALUES.map((period) => {
        const isActive = value === period;
        return (
          <Link
            key={period}
            href={`/leaderboard?period=${period}`}
            aria-current={isActive ? "page" : undefined}
            title={t.progress.timeRanges[period]}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-16 sm:flex-none",
              isActive
                ? "border-primary/30 bg-primary/15 text-primary"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.leaderboard.periods[period]}
          </Link>
        );
      })}
    </nav>
  );
}
