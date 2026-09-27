"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ClientSet } from "@/components/workout/types";
import { useTranslations } from "@/lib/i18n/locale-context";

interface WorkoutSetRowProps {
  set: ClientSet;
  setNumber: number;
  autoFocus?: boolean;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onDelete: () => void;
}

// Only allow characters that can form a valid non-negative decimal (weight)
// or whole (reps) number while typing, so users can't type letters or a
// stray "-" into the field. Full numeric validation still happens on save.
function sanitizeWeightInput(value: string): string {
  return value.replace(/[^0-9.]/g, "");
}

function sanitizeRepsInput(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

const setInputClassName = cn(
  "flex h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-2 text-center text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
);

export function WorkoutSetRow({
  set,
  setNumber,
  autoFocus,
  onChangeWeight,
  onChangeReps,
  onDelete,
}: WorkoutSetRowProps) {
  const t = useTranslations();
  const weightInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocus) {
      weightInputRef.current?.focus();
    }
    // Only run once, right when this row mounts as a newly added set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-[1.75rem_1fr_1fr_2rem] items-center gap-2.5 sm:grid-cols-[2rem_5rem_5rem_2rem] sm:gap-3">
      <span className="text-sm text-muted-foreground">{setNumber}</span>

      <input
        ref={weightInputRef}
        type="text"
        inputMode="decimal"
        value={set.weight}
        onChange={(event) => onChangeWeight(sanitizeWeightInput(event.target.value))}
        placeholder="0"
        aria-label={t.workout.weightAria(setNumber)}
        className={setInputClassName}
      />

      <input
        type="text"
        inputMode="numeric"
        value={set.reps}
        onChange={(event) => onChangeReps(sanitizeRepsInput(event.target.value))}
        placeholder="0"
        aria-label={t.workout.repsAria(setNumber)}
        className={setInputClassName}
      />

      <button
        type="button"
        onClick={onDelete}
        aria-label={t.workout.deleteSetAria(setNumber)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
