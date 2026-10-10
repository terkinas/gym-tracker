"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";

import { SectionHeading } from "@/components/progress/section-heading";
import { CategoryTile, categoryMeta } from "@/components/workout/workout-ui";
import { cn } from "@/lib/utils";
import { calculatePersonalRecords } from "@/lib/progress/analytics";
import type { Exercise } from "@/lib/exercises";
import type { AnalyticsWorkout } from "@/lib/types/workout";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatDate } from "@/lib/i18n/format";

interface RecentRecordsProps {
  workouts: AnalyticsWorkout[];
  exercises: Exercise[];
}

const MAX_ITEMS = 3;

/** The latest personal records, read straight from `calculatePersonalRecords`
 * (the same data `/rekordai` shows): for each exercise the most recently set
 * record, newest first. No new calculation. */
export function RecentRecords({ workouts, exercises }: RecentRecordsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const ui = t.progress.ui.recent;
  const kg = t.records.units.kg;

  const items = React.useMemo(() => {
    const records = calculatePersonalRecords(workouts);
    const list: { exercise: Exercise; label: string; result: string; date: string }[] = [];

    for (const exercise of exercises) {
      const record = records.get(exercise.id);
      if (!record) continue;

      // Candidates in priority order; the strictly newest date wins.
      const candidates: { label: string; result: string; date: string }[] = [];
      if (record.bestWeight > 0) {
        candidates.push({
          label: t.records.bestWeight,
          result: `${formatCount(record.bestWeight, locale)} ${kg}`,
          date: record.bestWeightDate,
        });
      }
      if (record.bestSet.volume > 0) {
        candidates.push({
          label: t.records.bestSet,
          result: `${formatCount(record.bestSet.weight, locale)} ${kg} × ${formatCount(record.bestSet.reps, locale)}`,
          date: record.bestSet.date,
        });
      }
      candidates.push({
        label: t.records.bestReps,
        result: `${formatCount(record.bestReps, locale)} ${t.records.units.reps}`,
        date: record.bestRepsDate,
      });

      const newest = candidates.reduce((best, c) => (c.date > best.date ? c : best));
      list.push({ exercise, ...newest });
    }

    return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, MAX_ITEMS);
  }, [workouts, exercises, locale, t, kg]);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="recent-records-title">
      <SectionHeading
        id="recent-records-title"
        icon={Trophy}
        tone="amber"
        title={ui.title}
        subtitle={ui.subtitle}
        action={
        <Link
          href="/rekordai"
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-none px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ui.viewAll}
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
        }
      />

      {items.length === 0 ? (
        <p className="rounded-none border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {ui.none}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.exercise.id}
              className={cn(
                "relative flex min-w-0 items-center gap-3.5 overflow-hidden rounded-none border border-border bg-surface bg-gradient-to-r from-transparent to-transparent py-4 pr-4 pl-5 transition-[background-color,border-color] duration-200 hover:border-foreground/20 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200",
                categoryMeta(item.exercise.category).wash,
              )}
            >
              <span
                aria-hidden="true"
                className={cn("absolute inset-y-0 left-0 w-1", categoryMeta(item.exercise.category).bar)}
              />
              <CategoryTile category={item.exercise.category} className="h-12 w-12" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-foreground">{item.exercise.name}</span>
                <span className="text-lg leading-tight font-bold text-foreground tabular-nums">{item.result}</span>
                <span className="text-xs text-muted-foreground">
                  {item.label} · {formatDate(item.date, locale)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
