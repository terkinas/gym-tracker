"use client";

import { Dumbbell, Flame, Layers3, ListChecks, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { TONES, type Tone } from "@/components/progress/section-heading";
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
        tone="orange"
        label={t.progress.overall.statWorkouts}
        hint={k.workoutsHint}
        value={formatCount(kpis.workouts, locale)}
      />
      <KpiCard
        icon={Layers3}
        tone="blue"
        label={t.progress.overall.statSets}
        hint={k.setsHint}
        value={formatCount(kpis.sets, locale)}
      />
      <KpiCard
        icon={Trophy}
        tone="amber"
        label={t.progress.overall.statPrs}
        hint={k.prsHint}
        value={formatCount(kpis.prs, locale)}
      />
      <KpiCard
        icon={ListChecks}
        tone="violet"
        label={k.exercisesLabel}
        hint={k.exercisesHint}
        value={formatCount(kpis.exercises, locale)}
      />
      <KpiCard
        icon={Flame}
        tone="orange"
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
  tone,
  label,
  hint,
  value,
  footnote,
  accent = true,
  className,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  hint: string;
  value: string;
  footnote?: string;
  /** False greys the icon out (e.g. no active streak). */
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-1 overflow-hidden rounded-none border border-border bg-surface p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200",
        className,
      )}
    >
      {accent && (
        <span
          aria-hidden="true"
          className={cn("pointer-events-none absolute -top-10 -right-10 h-28 w-28 blur-2xl", TONES[tone].glow)}
        />
      )}
      <div className="relative flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-none border",
            accent ? TONES[tone].tile : "border-border bg-muted/30 text-muted-foreground",
          )}
        >
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
        </span>
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="relative mt-2 text-4xl leading-none font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="relative text-xs text-muted-foreground">{hint}</span>
      {footnote && <span className="relative text-xs font-medium text-muted-foreground">{footnote}</span>}
    </div>
  );
}
