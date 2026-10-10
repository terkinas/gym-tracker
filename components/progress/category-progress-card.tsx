"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

import { CategoryTile, categoryMeta } from "@/components/workout/workout-ui";
import type { CategoryProgress } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";
import { formatCount, pluralize } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

interface CategoryProgressCardProps {
  data: CategoryProgress;
}

export function CategoryProgressCard({ data }: CategoryProgressCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const hasWorkouts = data.workoutCount > 0;
  const hasChart = data.hardSetSeries.length >= 2;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-none border border-border bg-surface bg-gradient-to-r from-transparent to-transparent py-4 pr-4 pl-5 transition-[background-color,border-color] duration-200 hover:border-foreground/20",
        categoryMeta(data.category).wash,
        !hasWorkouts && "opacity-70",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", categoryMeta(data.category).bar)}
      />
      <div className="flex items-center gap-3">
        <CategoryTile category={data.category} className="h-12 w-12" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-base font-semibold text-foreground">
            {translateCategory(data.category, t)}
          </h3>
          <span className="text-xs text-muted-foreground">
            {data.exerciseCount} {pluralize(locale, data.exerciseCount, t.progress.words.exercise)}
          </span>
        </div>
        {hasWorkouts && (
          <span className="shrink-0 text-right">
            <span className="block text-2xl leading-none font-bold text-foreground tabular-nums">
              {formatCount(data.hardSets, locale)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.progress.summary.hardSets.toLowerCase()}
            </span>
          </span>
        )}
      </div>

      {hasWorkouts ? (
        <>
          <p className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              {formatCount(data.workoutCount, locale)}{" "}
              {pluralize(locale, data.workoutCount, t.progress.words.workout)}
            </span>
            <span>
              {formatCount(data.totalSets, locale)}{" "}
              {pluralize(locale, data.totalSets, t.progress.words.set)}
            </span>
          </p>

          {hasChart ? (
            <div className={cn("h-12 w-full", categoryMeta(data.category).text)}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.hardSetSeries} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t.progress.categoriesSection.notEnoughDataChart}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t.progress.categoriesSection.noWorkoutsYet}
        </p>
      )}
    </div>
  );
}
