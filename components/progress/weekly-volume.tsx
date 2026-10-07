"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { translateCategory } from "@/lib/i18n/categories";
import { formatDate } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import { getTodayDateString } from "@/lib/date";
import { addDaysToDateString, startOfWeek } from "@/lib/progress/analytics";
import { getWeeklyMuscleVolume } from "@/lib/progress/volume";
import type { Exercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types/workout";

interface WeeklyVolumeProps {
  workouts: Workout[];
  exercises: Exercise[];
}

/** Weekly hard sets per muscle. The main number is always DIRECT sets; the
 * toggle only adds an informational indirect count next to it. */
export function WeeklyVolume({ workouts, exercises }: WeeklyVolumeProps) {
  const t = useTranslations();
  const locale = useLocale();
  const currentWeek = React.useMemo(() => startOfWeek(getTodayDateString()), []);
  const [weekStart, setWeekStart] = React.useState(currentWeek);
  const [showIndirect, setShowIndirect] = React.useState(false);

  const volume = React.useMemo(
    () => getWeeklyMuscleVolume(workouts, exercises, weekStart),
    [workouts, exercises, weekStart],
  );
  const totalDirect = volume.reduce((sum, row) => sum + row.direct, 0);
  const maxDirect = Math.max(1, ...volume.map((row) => row.direct));
  const weekEnd = addDaysToDateString(weekStart, 6);
  const isCurrentWeek = weekStart >= currentWeek;
  const w = t.progress.weeklyVolume;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setWeekStart(addDaysToDateString(weekStart, -7))}
          aria-label={w.previousWeek}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <span className="text-center text-sm font-medium text-foreground">
          {isCurrentWeek ? `${w.thisWeek} · ` : ""}
          {formatDate(weekStart, locale)} – {formatDate(weekEnd, locale)}
        </span>
        <button
          type="button"
          onClick={() => setWeekStart(addDaysToDateString(weekStart, 7))}
          disabled={isCurrentWeek}
          aria-label={w.nextWeek}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={showIndirect}
          onChange={(event) => setShowIndirect(event.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {w.toggleIndirect}
      </label>

      <ul className="flex flex-col gap-3">
        {volume.map((row) => (
          <li key={row.muscle} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">
                {translateCategory(row.muscle, t)}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {showIndirect
                  ? w.directIndirect(row.direct, row.indirect)
                  : w.directOnly(row.direct)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(row.direct / maxDirect) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm text-foreground">
        <span className="text-muted-foreground">{w.totalDirect}:</span>{" "}
        <span className="font-semibold tabular-nums">{totalDirect}</span>
      </p>
      {totalDirect === 0 && <p className="text-xs text-muted-foreground">{w.noSets}</p>}
      {showIndirect && <p className="text-xs text-muted-foreground">{w.indirectNote}</p>}
    </div>
  );
}
