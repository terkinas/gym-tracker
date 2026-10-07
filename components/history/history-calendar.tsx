import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDaysToDateString } from "@/lib/progress/analytics";
import { formatDate, formatMonthYear } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/** Month grid (Monday first). Days with a saved workout are filled squares
 * linking to the existing workout detail view; other days are outlined. */
export function HistoryCalendar({
  month,
  today,
  workoutByDate,
  t,
  locale,
}: {
  /** `YYYY-MM` being shown. */
  month: string;
  today: string;
  workoutByDate: Map<string, string>;
  t: Dictionary;
  locale: Locale;
}) {
  const first = `${month}-01`;
  const [year, monthIndex] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  // 0 = Monday … 6 = Sunday
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;

  const prevMonth = addDaysToDateString(first, -1).slice(0, 7);
  const nextMonth = addDaysToDateString(first, daysInMonth).slice(0, 7);
  const canGoNext = nextMonth <= today.slice(0, 7);

  const navClass =
    "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/istorija?month=${prevMonth}`}
          aria-label={t.history.calendar.previousMonth}
          className={navClass}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </Link>
        <h2 className="text-lg font-semibold tracking-tight text-foreground capitalize">
          {formatMonthYear(first, locale)}
        </h2>
        {canGoNext ? (
          <Link
            href={`/istorija?month=${nextMonth}`}
            aria-label={t.history.calendar.nextMonth}
            className={navClass}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </Link>
        ) : (
          <span className="h-9 w-9" aria-hidden="true" />
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {t.history.calendar.weekdays.map((day) => (
          <span
            key={day}
            className="text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            {day}
          </span>
        ))}

        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden="true" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = `${month}-${String(day).padStart(2, "0")}`;
          const workoutId = workoutByDate.get(date);
          const isToday = date === today;
          const base = cn(
            "flex aspect-square items-center justify-center rounded-md border text-sm tabular-nums",
            isToday && "ring-2 ring-ring ring-offset-1 ring-offset-background",
          );

          return workoutId ? (
            <Link
              key={date}
              href={`/istorija/${workoutId}`}
              aria-label={t.history.openWorkout(formatDate(date, locale))}
              className={cn(
                base,
                "border-primary bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {day}
            </Link>
          ) : (
            <span
              key={date}
              aria-label={t.history.calendar.emptyDay(formatDate(date, locale))}
              className={cn(base, "border-border text-muted-foreground")}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-primary bg-primary" />
          {t.history.calendar.legendWorkout}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-border" />
          {t.history.calendar.legendRest}
        </span>
      </div>
    </div>
  );
}
