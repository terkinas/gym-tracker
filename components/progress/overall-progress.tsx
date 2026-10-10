"use client";

import * as React from "react";
import Link from "next/link";
import { Dumbbell, Info, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SCORE_COMPONENT_ORDER,
  SCORE_WEIGHTS,
  STREAK_MAX_GAP_DAYS,
  MAX_SCORE,
} from "@/lib/progress/analytics";
import type { ProgressScore, ScoreComponentKey } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatSignedPercent } from "@/lib/i18n/format";

interface OverallProgressProps {
  /** Score for the period currently shown (precomputed server-side with the
   * same functions the leaderboard uses). */
  score: ProgressScore;
  /** True when "All time" is selected: the score only exists for 7/30/90, so
   * the 90-day one is shown and labelled as such. */
  isFallbackPeriod: boolean;
}

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** The hero of `/progress`: one big score, the progress %, what it means and
 * what it is made of. This component only presents numbers that were already
 * calculated — nothing is recomputed here. */
export function OverallProgress({ score, isFallbackPeriod }: OverallProgressProps) {
  const t = useTranslations();
  const locale = useLocale();
  const progressPct = score.strength.progressPct;
  const fraction = Math.min(1, Math.max(0, score.score / MAX_SCORE));

  if (!score.hasData) {
    return (
      <section
        aria-labelledby="overall-progress-title"
        className="flex flex-col items-center gap-4 rounded-none border border-dashed border-border px-5 py-10 text-center"
      >
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-none border border-border bg-muted/30 text-muted-foreground"
        >
          <TrendingUp className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="overall-progress-title" className="text-lg font-semibold text-foreground">
            {t.progress.overall.scoreLabel}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {t.progress.overall.notEnoughData}
          </p>
        </div>
        <Link
          href="/treniruote"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-none border border-input px-5 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Dumbbell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {t.progress.ui.noScoreCta}
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="overall-progress-title"
      className="grid grid-cols-1 gap-6 rounded-none border border-border bg-surface p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200 sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10"
    >
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={RING_RADIUS} fill="none" strokeWidth="9" className="stroke-muted" />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              className="stroke-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-300"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl leading-none font-semibold tracking-tight text-foreground tabular-nums sm:text-[2.75rem]">
              {formatCount(score.score, locale)}
            </span>
            <span className="mt-1 text-[0.7rem] text-muted-foreground">
              {t.progress.ui.scoreOutOf}
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <h2
            id="overall-progress-title"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
          >
            <TrendingUp className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {t.progress.overall.scoreLabel}
          </h2>
          {progressPct !== null ? (
            <p
              className={cn(
                "text-xl font-semibold tabular-nums",
                progressPct > 0
                  ? "text-primary"
                  : progressPct < 0
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {formatSignedPercent(progressPct, locale)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {t.progress.overall.progressSuffix}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t.progress.overall.strengthNoData}</p>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.progress.ui.scoreExplain}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-foreground">
            {t.progress.overall.breakdownTitle}
          </h3>
          <p className="text-xs text-muted-foreground">{t.progress.ui.breakdownHint}</p>
        </div>
        <ul className="flex flex-col gap-3.5">
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
          <p className="text-xs text-muted-foreground">
            {t.progress.overall.reducedStrengthWeight}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border/60 pt-4 lg:col-span-2">
        {isFallbackPeriod && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{t.progress.ui.allTimeScoreNote}</span>
          </p>
        )}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>
            {t.progress.ui.progressExplain} {t.progress.overall.disclaimer}{" "}
            {t.progress.overall.streakHint(STREAK_MAX_GAP_DAYS - 1)}
          </span>
        </p>
      </div>
    </section>
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
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {available ? `${weightPct}%` : `${weightPct}% · ${t.progress.overall.notEnoughShort}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        className="h-2 w-full overflow-hidden rounded-none bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-none motion-safe:transition-[width] motion-safe:duration-200",
            available ? "bg-gradient-to-r from-emerald-400 to-cyan-400" : "bg-muted-foreground/30",
          )}
          style={{ width: `${fill}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t.progress.ui.componentHints[componentKey]}</p>
    </li>
  );
}
