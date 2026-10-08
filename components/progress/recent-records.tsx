"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";

import { CategoryTile } from "@/components/workout/workout-ui";
import { calculatePersonalRecords } from "@/lib/progress/analytics";
import type { Exercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types/workout";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { formatCount, formatDate } from "@/lib/i18n/format";

interface RecentRecordsProps {
  workouts: Workout[];
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
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="recent-records-title" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <Trophy className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
            {ui.title}
          </h2>
          <p className="text-xs text-muted-foreground">{ui.subtitle}</p>
        </div>
        <Link
          href="/rekordai"
          className="inline-flex h-11 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ui.viewAll}
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {ui.none}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.exercise.id}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
            >
              <CategoryTile category={item.exercise.category} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-foreground">{item.exercise.name}</span>
                <span className="text-sm font-medium text-primary tabular-nums">{item.result}</span>
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
