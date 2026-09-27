"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientExercise } from "@/components/workout/types";
import { useTranslations } from "@/lib/i18n/locale-context";

interface RemoveExerciseDialogProps {
  exercise: ClientExercise | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (exercise: ClientExercise) => void;
}

export function RemoveExerciseDialog({
  exercise,
  onOpenChange,
  onConfirm,
}: RemoveExerciseDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={exercise !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.workout.removeExerciseDialog.title}</DialogTitle>
          <DialogDescription>
            {exercise
              ? t.workout.removeExerciseDialog.description(exercise.exerciseName)
              : null}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (exercise) onConfirm(exercise);
            }}
          >
            {t.workout.removeExerciseDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
