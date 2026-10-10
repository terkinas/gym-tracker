import { Award, Dumbbell, TrendingUp, User } from "lucide-react";

import { formatEntry } from "@/components/leaderboard/leaderboard-row";
import { ProgressIcon, ScoreMeter, progressChip } from "@/components/leaderboard/leaderboard-ui";
import type { LeaderboardEntry } from "@/lib/progress/analytics";
import type { Locale } from "@/lib/i18n/config";
import { formatCount } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/** Separate card for the viewer when they rank below the shown top list. */
export function YourPositionCard({
  entry,
  t,
  locale,
}: {
  entry: LeaderboardEntry;
  t: Dictionary;
  locale: Locale;
}) {
  const f = formatEntry(entry, t, locale);

  return (
    <section
      aria-label={t.leaderboard.yourPosition}
      className="relative flex flex-col gap-4 overflow-hidden rounded-none border border-primary/40 bg-card bg-gradient-to-r from-primary/10 to-transparent py-4 pr-4 pl-5 sm:py-5 sm:pr-5 sm:pl-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-cyan-400"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 bg-emerald-400/15 blur-2xl"
      />

      <div className="relative flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-white/20 bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-md shadow-emerald-500/30"
        >
          <User className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t.leaderboard.yourPosition}
          </h2>
          <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
        </div>
        <span className="text-3xl leading-none font-bold tabular-nums bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          #{formatCount(entry.rank, locale)}
        </span>
      </div>

      <div className="relative flex flex-col gap-2">
        <span className="flex items-baseline gap-2">
          <TrendingUp className="h-5 w-5 shrink-0 self-center text-primary" strokeWidth={1.75} aria-hidden="true" />
          <span className="text-3xl leading-none font-bold tracking-tight text-foreground tabular-nums">
            {f.score}
          </span>
          <span className="text-sm text-muted-foreground">{t.leaderboard.pts}</span>
        </span>
        <ScoreMeter score={entry.score} />
      </div>

      <dl className="relative grid grid-cols-3 gap-2">
        {[
          {
            label: t.leaderboard.columns.progress,
            value: f.progress,
            icon: <ProgressIcon pct={entry.progressPct} className="h-3.5 w-3.5" />,
            tone: progressChip(entry.progressPct),
          },
          {
            label: t.leaderboard.columns.workouts,
            value: formatCount(entry.workouts, locale),
            icon: <Dumbbell className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />,
            tone: "border-border/60 bg-muted/20 text-foreground",
          },
          {
            label: t.leaderboard.columns.prs,
            value: formatCount(entry.prs, locale),
            icon: <Award className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />,
            tone: "border-border/60 bg-muted/20 text-foreground",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("flex min-w-0 flex-col gap-1 rounded-none border px-3 py-2.5", stat.tone)}
          >
            <dt className="truncate text-[0.7rem] text-muted-foreground">{stat.label}</dt>
            <dd className="flex items-center gap-1 text-sm font-semibold tabular-nums">
              {stat.icon}
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
