"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { WeightPicker } from "@/components/workout/weight-picker";
import { RepsPicker } from "@/components/workout/reps-picker";
import { DeleteSetDialog } from "@/components/workout/delete-set-dialog";
import type { ClientSet } from "@/components/workout/types";
import { useTranslations } from "@/lib/i18n/locale-context";
import { isSetHand, type SetHand } from "@/lib/types/workout";

/** Column layout shared by the set rows and the header row above them. The
 * hand column only exists for one-handed exercises, so other exercises keep
 * exactly the previous layout. */
export function setGridClass(isOneHanded: boolean): string {
  return isOneHanded
    ? "grid-cols-[1.5rem_minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,1.15fr)_2rem_2.25rem] gap-1.5 sm:grid-cols-[2rem_6rem_5rem_7rem_3rem_2.5rem] sm:gap-3"
    : "grid-cols-[1.5rem_minmax(0,1.3fr)_minmax(0,1fr)_2rem_2.25rem] gap-2 sm:grid-cols-[2rem_6rem_5rem_3rem_2.5rem] sm:gap-3";
}

interface WorkoutSetRowProps {
  set: ClientSet;
  setNumber: number;
  /** First row of the exercise: only subtly emphasised. */
  isFirst?: boolean;
  /** Shows the left/right control. Never true for ordinary exercises. */
  isOneHanded: boolean;
  autoFocus?: boolean;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onChangeHand: (value: SetHand) => void;
  onChangeHardSet: (value: boolean) => void;
  onDelete: () => void;
}

export function WorkoutSetRow({
  set,
  setNumber,
  isFirst = false,
  isOneHanded,
  autoFocus,
  onChangeWeight,
  onChangeReps,
  onChangeHand,
  onChangeHardSet,
  onDelete,
}: WorkoutSetRowProps) {
  const t = useTranslations();
  const rowRef = React.useRef<HTMLDivElement>(null);
  // Each row owns its own confirmation state, so the dialog can only ever
  // delete the set this row renders.
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  React.useEffect(() => {
    if (autoFocus) {
      // There is no text field to focus any more (weight/reps are wheels), so
      // just make sure a freshly added row is visible.
      rowRef.current?.scrollIntoView({ block: "nearest" });
    }
    // Only run once, right when this row mounts as a newly added set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel wrapper: a barely-there ring while a wheel is being used.
  const pickerWrapClass =
    "min-w-0 rounded-xl transition-shadow duration-150 focus-within:ring-1 focus-within:ring-primary/30";

  return (
    <div
      ref={rowRef}
      className={`grid items-center ${setGridClass(isOneHanded)} ${
        isFirst ? "" : "border-t border-border/40 pt-2"
      } ${autoFocus ? "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200" : ""}`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums ${
          isFirst ? "bg-foreground/10 text-foreground" : "bg-muted/60 text-muted-foreground"
        }`}
      >
        {setNumber}
      </span>

      <div className={pickerWrapClass}>
        <WeightPicker
          value={set.weight}
          onChange={onChangeWeight}
          ariaLabel={t.workout.weightAria(setNumber)}
        />
      </div>

      <div className={pickerWrapClass}>
        <RepsPicker
          value={set.reps}
          onChange={onChangeReps}
          ariaLabel={t.workout.repsAria(setNumber)}
        />
      </div>

      {isOneHanded && (
        <Select
          value={set.hand ?? ""}
          onValueChange={(value) => {
            if (isSetHand(value)) onChangeHand(value);
          }}
        >
          <SelectTrigger
            aria-label={t.workout.handAria(setNumber)}
            className="h-11 gap-1 rounded-xl px-2 text-xs sm:px-3 sm:text-sm"
          >
            <SelectValue placeholder={t.workout.hand.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">{t.workout.hand.left}</SelectItem>
            <SelectItem value="right">{t.workout.hand.right}</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* 44px tap area around the 20px checkbox. */}
      <label className="mx-auto flex h-11 w-11 cursor-pointer items-center justify-center justify-self-center">
        <input
          type="checkbox"
          checked={set.isHardSet}
          onChange={(event) => onChangeHardSet(event.target.checked)}
          aria-label={t.workout.hardSetAria(setNumber)}
          className="h-5 w-5 cursor-pointer rounded border-input accent-primary transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label={t.workout.deleteSetAria(setNumber)}
        className="flex h-11 w-11 items-center justify-center justify-self-center rounded-xl text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
      </button>

      <DeleteSetDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete();
        }}
      />
    </div>
  );
}
