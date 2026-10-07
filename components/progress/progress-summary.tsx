"use client";

import { Activity, BarChart3, Dumbbell, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ProgressSummary as ProgressSummaryData } from "@/lib/progress/analytics";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatDate, pluralize } from "@/lib/i18n/format";

interface ProgressSummaryProps {
  summary: ProgressSummaryData;
}

export function ProgressSummary({ summary }: ProgressSummaryProps) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={Dumbbell}
          label={t.progress.summary.workouts}
          value={formatCount(summary.totalWorkouts, locale)}
        />
        <SummaryCard
          icon={BarChart3}
          label={t.progress.summary.sets}
          value={formatCount(summary.totalSets, locale)}
        />
        <SummaryCard
          icon={Activity}
          label={t.progress.summary.hardSets}
          value={formatCount(summary.totalHardSets, locale)}
        />
        <SummaryCard
          icon={ListChecks}
          label={t.progress.summary.exercises}
          value={formatCount(summary.totalExercises, locale)}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {summary.lastWorkoutDate && (
          <span>
            {t.progress.summary.lastWorkoutLabel}{" "}
            <span className="font-medium text-foreground">
              {formatDate(summary.lastWorkoutDate, locale)}
            </span>
          </span>
        )}
        <span>
          {t.progress.summary.thisWeekLabel}{" "}
          <span className="font-medium text-foreground">
            {summary.workoutsThisWeek}{" "}
            {pluralize(locale, summary.workoutsThisWeek, t.progress.words.workout)}
          </span>
        </span>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="gap-2 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-2xl font-semibold tracking-tight text-foreground">{value}</span>
    </Card>
  );
}
