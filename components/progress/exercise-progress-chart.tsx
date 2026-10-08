"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/progress/chart-tooltip";
import type { DailyPoint } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatShortDate } from "@/lib/i18n/format";

interface ExerciseProgressChartProps {
  data: DailyPoint[];
}

export function ExerciseProgressChart({ data }: ExerciseProgressChartProps) {
  const t = useTranslations();
  const locale = useLocale();

  // Guarded here too (not just by the caller) so this component stays safe
  // to reuse — an exercise with no recorded sets has nothing to plot.
  if (data.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-sm text-muted-foreground">
        {t.progress.ui.exercise.noChartInRange}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => formatShortDate(value, locale)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
          unit=" kg"
          domain={[(min: number) => Math.max(0, Math.floor(min - 2)), (max: number) => Math.ceil(max + 2)]}
          allowDecimals={false}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip
              {...props}
              valueLabel={t.progress.charts.maxWeightValueLabel}
              valueFormatter={(value) => `${value} kg`}
            />
          )}
          cursor={{ stroke: "var(--border)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--primary)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
