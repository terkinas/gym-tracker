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
    ? "grid-cols-[1.25rem_minmax(0,1.1fr)_minmax(0,0.85fr)_minmax(0,1.2fr)_2rem] gap-2 sm:grid-cols-[2rem_6rem_5rem_7rem_2rem] sm:gap-3"
    : "grid-cols-[1.75rem_minmax(0,1.3fr)_minmax(0,1fr)_2rem] gap-2.5 sm:grid-cols-[2rem_6rem_5rem_2rem] sm:gap-3";
}

interface WorkoutSetRowProps {
  set: ClientSet;
  setNumber: number;
  /** Shows the left/right control. Never true for ordinary exercises. */
  isOneHanded: boolean;
  autoFocus?: boolean;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onChangeHand: (value: SetHand) => void;
  onDelete: () => void;
}

export function WorkoutSetRow({
  set,
  setNumber,
  isOneHanded,
  autoFocus,
  onChangeWeight,
  onChangeReps,
  onChangeHand,
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

  return (
    <div
      ref={rowRef}
      className={`grid items-center ${setGridClass(isOneHanded)}`}
    >
      <span className="text-sm text-muted-foreground">{setNumber}</span>

      <WeightPicker
        value={set.weight}
        onChange={onChangeWeight}
        ariaLabel={t.workout.weightAria(setNumber)}
      />

      <RepsPicker
        value={set.reps}
        onChange={onChangeReps}
        ariaLabel={t.workout.repsAria(setNumber)}
      />

      {isOneHanded && (
        <Select
          value={set.hand ?? ""}
          onValueChange={(value) => {
            if (isSetHand(value)) onChangeHand(value);
          }}
        >
          <SelectTrigger
            aria-label={t.workout.handAria(setNumber)}
            className="h-11 gap-1 px-2 text-xs sm:px-3 sm:text-sm"
          >
            <SelectValue placeholder={t.workout.hand.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">{t.workout.hand.left}</SelectItem>
            <SelectItem value="right">{t.workout.hand.right}</SelectItem>
          </SelectContent>
        </Select>
      )}

      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label={t.workout.deleteSetAria(setNumber)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
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
