"use client";

import { cn } from "@/lib/utils";
import { TIME_RANGE_VALUES } from "@/lib/progress/analytics";
import type { TimeRange } from "@/lib/progress/analytics";
import { useTranslations } from "@/lib/i18n/locale-context";

interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  const t = useTranslations();

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
      {TIME_RANGE_VALUES.map((rangeValue) => (
        <button
          key={rangeValue}
          type="button"
          onClick={() => onChange(rangeValue)}
          aria-pressed={value === rangeValue}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            value === rangeValue
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.progress.timeRanges[rangeValue]}
        </button>
      ))}
    </div>
  );
}
