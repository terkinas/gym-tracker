"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 40; // px — one row of the wheel

/** Index of the option closest to `value` (0 when nothing is chosen yet).
 * "Closest" rather than "exact" so a legacy value that isn't on the wheel
 * (e.g. stored before the step existed) still positions the wheel sensibly
 * without being rewritten. */
function closestIndex(options: readonly number[], value: number | null): number {
  if (value === null) return 0;
  let best = 0;
  for (let i = 1; i < options.length; i += 1) {
    if (Math.abs(options[i] - value) < Math.abs(options[best] - value)) best = i;
  }
  return best;
}

interface WheelPickerProps {
  /** Every selectable value, in ascending order (e.g. 0–50 step 1, or
   * 0–200 step 2.5). Nothing outside this list can be emitted. */
  options: readonly number[];
  /** Current value, or null when none has been chosen yet. */
  value: number | null;
  onChange: (value: number) => void;
  ariaLabel: string;
  /** How an option is rendered, e.g. locale-aware decimals. */
  formatOption?: (option: number) => string;
  /** Small suffix shown beside the selected value only (e.g. "kg"). */
  unit?: string;
  className?: string;
}

/** Compact touch wheel picker built on CSS scroll snapping: three rows are
 * visible, the centred row is the selection. No keyboard is opened, and it
 * isn't an <input>, so mobile browsers never zoom on focus. Shared by the
 * KG and reps pickers. */
export function WheelPicker({
  options,
  value,
  onChange,
  ariaLabel,
  formatOption = String,
  unit,
  className,
}: WheelPickerProps) {
  const lastIndex = options.length - 1;
  const clampIndex = React.useCallback(
    (index: number) => Math.min(lastIndex, Math.max(0, index)),
    [lastIndex],
  );

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const settleTimer = React.useRef<number | null>(null);
  const valueIndex = closestIndex(options, value);
  // Latest props for use inside the debounced settle callback.
  const latest = React.useRef({ valueIndex, onChange, options });
  // While the wheel is moving, show the row under the highlight live; once it
  // settles we commit and fall back to the value from props.
  const [scrollIndex, setScrollIndex] = React.useState<number | null>(null);
  const displayIndex = scrollIndex ?? valueIndex;

  React.useEffect(() => {
    latest.current = { valueIndex, onChange, options };
  });

  const scrollToIndex = React.useCallback(
    (index: number, smooth: boolean) => {
      scrollerRef.current?.scrollTo({
        top: clampIndex(index) * ITEM_HEIGHT,
        behavior: smooth ? "smooth" : "instant",
      });
    },
    [clampIndex],
  );

  // Position the wheel on mount, and follow value changes that didn't come
  // from the user scrolling it (e.g. a reloaded workout).
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (Math.round(el.scrollTop / ITEM_HEIGHT) !== valueIndex) {
      scrollToIndex(valueIndex, false);
    }
  }, [valueIndex, scrollToIndex]);

  React.useEffect(
    () => () => {
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    },
    [],
  );

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    setScrollIndex(clampIndex(Math.round(el.scrollTop / ITEM_HEIGHT)));

    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const index = clampIndex(Math.round(el.scrollTop / ITEM_HEIGHT));
      setScrollIndex(null);
      // Compare against the current value so programmatic positioning (mount,
      // reload, legacy off-wheel data) never rewrites the stored value.
      if (index !== latest.current.valueIndex) {
        latest.current.onChange(latest.current.options[index]);
      }
    }, 120);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      scrollToIndex(displayIndex + (event.key === "ArrowUp" ? -1 : 1), true);
    }
  }

  return (
    <div
      className={cn("relative w-full min-w-0 select-none", className)}
      style={{ height: ITEM_HEIGHT * 3 }}
    >
      {/* Selection band behind the centred row. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 rounded-none border border-primary/40 bg-primary/10"
        style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />

      <div
        ref={scrollerRef}
        role="spinbutton"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={options[0]}
        aria-valuemax={options[lastIndex]}
        aria-valuenow={options[displayIndex]}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="relative h-full touch-pan-y snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-none [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
      >
        <div aria-hidden="true" style={{ height: ITEM_HEIGHT }} />
        {options.map((option, index) => {
          const selected = index === displayIndex;
          return (
            <div
              key={option}
              aria-hidden="true"
              onClick={() => scrollToIndex(index, true)}
              className={cn(
                "flex w-full cursor-pointer snap-center items-baseline justify-center gap-1 whitespace-nowrap tabular-nums transition-colors",
                selected
                  ? "items-center text-2xl font-semibold text-foreground"
                  : "items-center text-xl text-muted-foreground/60",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {formatOption(option)}
              {selected && unit && (
                <span className="text-sm font-medium text-muted-foreground">{unit}</span>
              )}
            </div>
          );
        })}
        <div aria-hidden="true" style={{ height: ITEM_HEIGHT }} />
      </div>
    </div>
  );
}
