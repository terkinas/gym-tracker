"use client";

import * as React from "react";
import { Dumbbell, Flame, Info, ListChecks, Trophy, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SCORE_PERIOD,
  SCORE_COMPONENT_ORDER,
  SCORE_PERIOD_VALUES,
  SCORE_WEIGHTS,
  STREAK_MAX_GAP_DAYS,
} from "@/lib/progress/analytics";
import type { ProgressOverview, ScoreComponentKey, ScorePeriod } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatSignedPercent, pluralizeThree } from "@/lib/i18n/format";

interface OverallProgressProps {
  overview: ProgressOverview;
}

/** The "Overall Progress" block at the top of `/progress`. All numbers were
 * computed server-side with the exact same functions the leaderboard uses;
 * this component only switches between the three precomputed periods. */
export function OverallProgress({ overview }: OverallProgressProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [period, setPeriod] = React.useState<ScorePeriod>(DEFAULT_SCORE_PERIOD);

  const score = overview.scores[period];
  const { streak } = overview;
  const progressPct = score.strength.progressPct;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="overall-progress-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="overall-progress-title" className="text-lg font-semibold tracking-tight text-foreground">
          {t.progress.overall.title}
        </h2>
        <div
          role="group"
          aria-label={t.progress.overall.periodAria}
          className="inline-flex w-fit gap-1 rounded-md border border-border bg-card p-1"
        >
          {SCORE_PERIOD_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                period === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.progress.timeRanges[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {score.hasData ? (
          <Card className="justify-center gap-2 p-6">
            <span className="text-sm text-muted-foreground">{t.progress.overall.scoreLabel}</span>
            <span className="text-5xl font-semibold tracking-tight text-foreground tabular-nums">
              {formatCount(score.score, locale)}
            </span>
            {progressPct !== null ? (
              <span
                className={cn(
                  "flex items-center gap-1.5 text-base font-medium tabular-nums",
                  progressPct > 0 ? "text-primary" : progressPct < 0 ? "text-destructive" : "text-muted-foreground",
                )}
              >
                <TrendingUp className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {formatSignedPercent(progressPct, locale)} {t.progress.overall.progressSuffix}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">{t.progress.overall.strengthNoData}</span>
            )}
            <span className="text-xs text-muted-foreground">{t.progress.timeRanges[period]}</span>
          </Card>
        ) : (
          <Card className="justify-center gap-2 border-dashed p-6 text-center">
            <span className="text-sm text-muted-foreground">{t.progress.overall.notEnoughData}</span>
            <span className="text-xs text-muted-foreground">{t.progress.timeRanges[period]}</span>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard icon={Dumbbell} label={t.progress.overall.statWorkouts} value={formatCount(score.workouts, locale)} />
          <StatCard icon={ListChecks} label={t.progress.overall.statSets} value={formatCount(score.sets, locale)} />
          <StatCard icon={Trophy} label={t.progress.overall.statPrs} value={formatCount(score.prs, locale)} />
          <StatCard
            icon={Flame}
            label={t.progress.overall.currentStreak}
            value={formatCount(streak.current, locale)}
            caption={`${pluralizeThree(locale, streak.current, t.progress.overall.workoutsWord)} ${t.progress.overall.inARow}`}
            footnote={`${t.progress.overall.longestStreak}: ${formatCount(streak.longest, locale)}`}
          />
        </div>
      </div>

      {score.hasData && (
        <Card className="gap-4 p-5">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {t.progress.overall.breakdownTitle}
          </h3>
          <ul className="flex flex-col gap-4">
            {SCORE_COMPONENT_ORDER.map((key) => (
              <BreakdownRow
                key={key}
                componentKey={key}
                value={score.components[key].value}
                available={score.components[key].available}
              />
            ))}
          </ul>
          {score.strength.confidence < 1 && (
            <p className="text-xs text-muted-foreground">{t.progress.overall.reducedStrengthWeight}</p>
          )}
        </Card>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span>
          {t.progress.overall.disclaimer} {t.progress.overall.streakHint(STREAK_MAX_GAP_DAYS - 1)}
        </span>
      </p>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  footnote,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  footnote?: string;
}) {
  return (
    <Card className="min-w-0 gap-2 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate text-sm">{label}</span>
      </div>
      <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
      {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
      {footnote && <span className="text-xs text-muted-foreground">{footnote}</span>}
    </Card>
  );
}

function BreakdownRow({
  componentKey,
  value,
  available,
}: {
  componentKey: ScoreComponentKey;
  value: number;
  available: boolean;
}) {
  const t = useTranslations();
  const label = t.progress.overall[componentKey];
  const weightPct = Math.round(SCORE_WEIGHTS[componentKey] * 100);
  const fill = available ? Math.round(value * 100) : 0;

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {available ? `${weightPct}%` : `${weightPct}% · ${t.progress.overall.notEnoughShort}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", available ? "bg-primary" : "bg-muted-foreground/30")}
          style={{ width: `${fill}%` }}
        />
      </div>
    </li>
  );
}
