"use client";

import { WheelPicker } from "@/components/workout/wheel-picker";
import { formatCount } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";

/** Weight wheel: 0–200 kg in 1 kg steps. Also used by the workout page's
 * validation so the picker and the save check can never disagree. */
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 200;
export const WEIGHT_STEP = 1;

const WEIGHT_OPTIONS: readonly number[] = Array.from(
  { length: (WEIGHT_MAX - WEIGHT_MIN) / WEIGHT_STEP + 1 },
  // Whole numbers are exact in floating point, so no rounding drift.
  (_, i) => WEIGHT_MIN + i * WEIGHT_STEP,
);

/** True for a finite weight on the wheel: within range and a whole multiple
 * of the step (so 21 or 202.5 are rejected). */
export function isValidWeight(value: number): boolean {
  if (!Number.isFinite(value) || value < WEIGHT_MIN || value > WEIGHT_MAX) return false;
  const steps = (value - WEIGHT_MIN) / WEIGHT_STEP;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

interface WeightPickerProps {
  /** Raw string, same representation the rest of the workout UI uses
   * ("" = not chosen yet, which is treated as 0 kg on save). */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

export function WeightPicker({ value, onChange, ariaLabel }: WeightPickerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const parsed = Number.parseFloat(value);

  return (
    <WheelPicker
      options={WEIGHT_OPTIONS}
      value={Number.isFinite(parsed) ? parsed : null}
      // The workout state keeps raw strings (as before); they're converted to
      // a validated `number` on save, so the saved format is unchanged.
      onChange={(next) => onChange(String(next))}
      ariaLabel={ariaLabel}
      formatOption={(option) => formatCount(option, locale)}
      unit={t.records.units.kg}
    />
  );
}
