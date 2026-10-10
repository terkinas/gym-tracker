import Link from "next/link";

import { cn } from "@/lib/utils";
import { SCORE_PERIOD_VALUES } from "@/lib/progress/analytics";
import type { ScorePeriod } from "@/lib/progress/analytics";
import type { Dictionary } from "@/lib/i18n/translations";

/** `7D | 30D | 90D` chips. Same look as the /progress range chips and the
 * /pratimai category filter: outlined, the active one filled with the brand
 * gradient. Plain links to `?period=…` so the period lives in the URL and the
 * leaderboard is recomputed server-side on each change — no client state, no
 * userId or scores ever come from the client. */
export function LeaderboardPeriodTabs({ value, t }: { value: ScorePeriod; t: Dictionary }) {
  return (
    <nav aria-label={t.leaderboard.periodAria} className="flex w-full gap-2 sm:w-fit">
      {SCORE_PERIOD_VALUES.map((period) => {
        const isActive = value === period;
        return (
          <Link
            key={period}
            href={`/leaderboard?period=${period}`}
            aria-current={isActive ? "page" : undefined}
            title={t.progress.timeRanges[period]}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-none border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:active:scale-100 sm:min-w-16 sm:flex-none",
              isActive
                ? "border-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950"
                : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.leaderboard.periods[period]}
          </Link>
        );
      })}
    </nav>
  );
}
