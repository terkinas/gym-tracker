"use client";

import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { TIME_RANGE_VALUES } from "@/lib/progress/analytics";
import type { TimeRange } from "@/lib/progress/analytics";
import { useTranslations } from "@/lib/i18n/locale-context";

interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

/** 7D | 30D | 90D | All segmented control. Same look as the leaderboard's
 * period tabs; every segment is a 44px touch target. */
export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  const t = useTranslations();

  return (
    <div
      role="group"
      aria-label={t.progress.ui.rangeAria}
      className="flex w-full items-center gap-1 rounded-xl border border-border bg-muted/20 p-1 sm:w-fit"
    >
      <CalendarDays
        className="mx-2 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {TIME_RANGE_VALUES.map((rangeValue) => {
        const isActive = value === rangeValue;
        return (
          <button
            key={rangeValue}
            type="button"
            onClick={() => onChange(rangeValue)}
            aria-pressed={isActive}
            title={t.progress.timeRanges[rangeValue]}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-16 sm:flex-none",
              isActive
                ? "border-primary/30 bg-primary/15 text-primary"
                : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.progress.ui.rangesShort[rangeValue]}
          </button>
        );
      })}
    </div>
  );
}
