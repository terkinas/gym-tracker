"use client";

import { WheelPicker } from "@/components/workout/wheel-picker";

/** Single source of truth for the reps limit — also used by the workout
 * page's validation so the picker and the save check can never disagree. */
export const REPS_MIN = 0;
export const REPS_MAX = 50;
const REPS_STEP = 1;

const REPS_OPTIONS: readonly number[] = Array.from(
  { length: (REPS_MAX - REPS_MIN) / REPS_STEP + 1 },
  (_, i) => REPS_MIN + i * REPS_STEP,
);

interface RepsPickerProps {
  /** Raw string, same representation the rest of the workout UI uses
   * ("" = not chosen yet). Only whole numbers 0–50 are ever emitted. */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

export function RepsPicker({ value, onChange, ariaLabel }: RepsPickerProps) {
  const parsed = Number.parseInt(value, 10);
  return (
    <WheelPicker
      options={REPS_OPTIONS}
      value={Number.isFinite(parsed) ? parsed : null}
      onChange={(next) => onChange(String(next))}
      ariaLabel={ariaLabel}
    />
  );
}
