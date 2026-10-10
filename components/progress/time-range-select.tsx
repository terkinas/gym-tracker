"use client";

import { cn } from "@/lib/utils";
import { TIME_RANGE_VALUES } from "@/lib/progress/analytics";
import type { TimeRange } from "@/lib/progress/analytics";
import { useTranslations } from "@/lib/i18n/locale-context";

interface TimeRangeSelectProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

/** 7D | 30D | 90D | All chips. Same look as the /pratimai category filter:
 * outlined chips, the active one filled with the brand gradient. Every chip
 * is a 44px touch target. */
export function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  const t = useTranslations();

  return (
    <div role="group" aria-label={t.progress.ui.rangeAria} className="flex w-full gap-2 sm:w-fit">
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
              "flex h-11 flex-1 items-center justify-center rounded-none border px-4 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:active:scale-100 sm:min-w-16 sm:flex-none",
              isActive
                ? "border-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950"
                : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.progress.ui.rangesShort[rangeValue]}
          </button>
        );
      })}
    </div>
  );
}
