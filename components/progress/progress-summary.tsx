"use client";

import { Dumbbell, Flame, Layers3, ListChecks, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StreakResult } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, pluralizeThree } from "@/lib/i18n/format";

export interface KpiValues {
  workouts: number;
  sets: number;
  prs: number;
  /** Different exercises trained in the period. */
  exercises: number;
}

interface ProgressSummaryProps {
  kpis: KpiValues;
  streak: StreakResult;
}

/** The five headline numbers under the score: workouts, sets, PRs, streak,
 * exercises. Values come from the existing analytics for the selected period. */
export function ProgressSummary({ kpis, streak }: ProgressSummaryProps) {
  const t = useTranslations();
  const locale = useLocale();
  const k = t.progress.ui.kpi;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiCard
        icon={Dumbbell}
        label={t.progress.overall.statWorkouts}
        hint={k.workoutsHint}
        value={formatCount(kpis.workouts, locale)}
      />
      <KpiCard
        icon={Layers3}
        label={t.progress.overall.statSets}
        hint={k.setsHint}
        value={formatCount(kpis.sets, locale)}
      />
      <KpiCard
        icon={Trophy}
        label={t.progress.overall.statPrs}
        hint={k.prsHint}
        value={formatCount(kpis.prs, locale)}
      />
      <KpiCard
        icon={ListChecks}
        label={k.exercisesLabel}
        hint={k.exercisesHint}
        value={formatCount(kpis.exercises, locale)}
      />
      <KpiCard
        icon={Flame}
        accent={streak.current > 0}
        className="col-span-2 lg:col-span-1"
        label={t.progress.overall.currentStreak}
        hint={`${pluralizeThree(locale, streak.current, t.progress.overall.workoutsWord)} ${t.progress.overall.inARow}`}
        value={formatCount(streak.current, locale)}
        footnote={`${t.progress.overall.longestStreak}: ${formatCount(streak.longest, locale)}`}
      />
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  hint,
  value,
  footnote,
  accent = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  value: string;
  footnote?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-2xl border bg-card p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200",
        accent ? "border-primary/30" : "border-border",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
            accent
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted/30",
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="mt-1 text-3xl leading-none font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
      {footnote && <span className="text-xs font-medium text-muted-foreground">{footnote}</span>}
    </div>
  );
}
