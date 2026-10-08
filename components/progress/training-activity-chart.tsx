"use client";

import Link from "next/link";
import { Dumbbell } from "lucide-react";
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
      <div className="flex h-56 flex-col items-center justify-center gap-3 text-center">
        <p className="max-w-xs text-sm text-muted-foreground">
          {t.progress.charts.noDataThisPeriodActivity}
        </p>
        <Link
          href="/treniruote"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input px-4 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Dumbbell className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {t.progress.ui.noScoreCta}
        </Link>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
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
          cursor={{ fill: "var(--accent)", fillOpacity: 0.5 }}
        />
        <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
