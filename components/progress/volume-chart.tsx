"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/progress/chart-tooltip";
import type { DailyPoint } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCompactNumber, formatShortDate, formatVolume } from "@/lib/i18n/format";

interface VolumeChartProps {
  data: DailyPoint[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  const t = useTranslations();
  const locale = useLocale();

  if (data.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-sm text-muted-foreground">
        {t.progress.charts.noDataThisPeriodVolume}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => formatShortDate(value, locale)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) => formatCompactNumber(value, locale)}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip
              {...props}
              valueLabel={t.progress.charts.volumeValueLabel}
              valueFormatter={(value) => formatVolume(value, locale)}
            />
          )}
          cursor={{ stroke: "var(--border)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={data.length <= 20}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
