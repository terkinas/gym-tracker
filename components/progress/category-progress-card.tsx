"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

import { Badge } from "@/components/ui/badge";
import type { CategoryProgress } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";
import { formatCount, formatVolume, pluralize } from "@/lib/i18n/format";

interface CategoryProgressCardProps {
  data: CategoryProgress;
}

export function CategoryProgressCard({ data }: CategoryProgressCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const hasWorkouts = data.workoutCount > 0;
  const hasChart = data.volumeSeries.length >= 2;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">
          {translateCategory(data.category, t)}
        </h3>
        <Badge>
          {data.exerciseCount} {pluralize(locale, data.exerciseCount, t.progress.words.exercise)}
        </Badge>
      </div>

      {hasWorkouts ? (
        <>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span>
              {formatCount(data.workoutCount, locale)}{" "}
              {pluralize(locale, data.workoutCount, t.progress.words.workout)}
            </span>
            <span>
              {formatCount(data.totalSets, locale)}{" "}
              {pluralize(locale, data.totalSets, t.progress.words.set)}
            </span>
            <span className="font-medium text-foreground">
              {formatVolume(data.totalVolume, locale)}
            </span>
          </div>

          {hasChart ? (
            <div className="h-16 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.volumeSeries} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--primary)"
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
        <p className="text-sm text-muted-foreground">
          {t.progress.categoriesSection.noWorkoutsYet}
        </p>
      )}
    </div>
  );
}
