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
import type { Exercise } from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";

interface DeleteExerciseDialogProps {
  exercise: Exercise | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (exercise: Exercise) => void;
}

export function DeleteExerciseDialog({
  exercise,
  onOpenChange,
  onConfirm,
}: DeleteExerciseDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={exercise !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.exercises.deleteDialog.title}</DialogTitle>
          <DialogDescription>
            {exercise ? t.exercises.deleteDialog.description(exercise.name) : null}
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
            {t.exercises.deleteDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
