"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/progress/chart-tooltip";
import type { DailyPoint } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatShortDate } from "@/lib/i18n/format";

interface TrainingActivityChartProps {
  data: DailyPoint[];
}

export function TrainingActivityChart({ data }: TrainingActivityChartProps) {
  const t = useTranslations();
  const locale = useLocale();

  if (data.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-sm text-muted-foreground">
        {t.progress.charts.noDataThisPeriodActivity}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => formatShortDate(value, locale)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip {...props} valueLabel={t.progress.charts.setsValueLabel} />
          )}
          cursor={{ fill: "var(--accent)" }}
        />
        <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
