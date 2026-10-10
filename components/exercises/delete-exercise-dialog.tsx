"use client";

import { Trash2, X } from "lucide-react";

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
  isDeleting?: boolean;
}

export function DeleteExerciseDialog({
  exercise,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteExerciseDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={exercise !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none p-5 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>{t.exercises.deleteDialog.title}</DialogTitle>
          <DialogDescription>
            {exercise ? t.exercises.deleteDialog.description(exercise.name) : null}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-none sm:h-11"
          >
            <X className="h-4 w-4" strokeWidth={2} />
            {t.common.cancel}
          </Button>
          <Button
            loading={isDeleting}
            className="h-12 rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:h-11"
            onClick={() => {
              if (exercise) onConfirm(exercise);
            }}
          >
            {!isDeleting && <Trash2 className="h-4 w-4" strokeWidth={2} />}
            {t.exercises.deleteDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
