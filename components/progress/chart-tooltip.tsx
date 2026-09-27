"use client";

import type { ReactNode } from "react";

import { useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/i18n/format";

// Loosely typed to match whatever shape recharts injects (its own payload
// value type varies by chart and version) — this component only ever reads
// the first entry's `value` and coerces it to a number itself.
interface TooltipPayloadEntry {
  value?: unknown;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: ReactNode;
  payload?: TooltipPayloadEntry[];
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
  // Recharts injects several other props (formatter, separator, itemStyle,
  // etc.) that this component doesn't use — allow and ignore them.
  [extra: string]: unknown;
}

/** Custom tooltip content for the dashboard's recharts charts — recharts
 * calls this with `active`/`payload`/`label` injected, so pass it as
 * `content={(props) => <ChartTooltip {...props} valueLabel="..." />}`. */
export function ChartTooltip({
  active,
  label,
  payload,
  valueLabel,
  valueFormatter,
}: ChartTooltipProps) {
  const locale = useLocale();

  if (!active || !payload || payload.length === 0) return null;

  const rawValue = payload[0]?.value;
  const value = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0);

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">
        {label !== undefined ? formatDate(String(label), locale) : ""}
      </p>
      <p className="text-muted-foreground">
        {valueLabel ? `${valueLabel}: ` : ""}
        <span className="font-medium text-foreground">
          {valueFormatter ? valueFormatter(value) : value}
        </span>
      </p>
    </div>
  );
}
