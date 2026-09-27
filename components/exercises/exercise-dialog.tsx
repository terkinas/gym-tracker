"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXERCISE_CATEGORIES,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";

interface ExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise | null;
  onSubmit: (values: { name: string; category: ExerciseCategory }) => void;
}

export function ExerciseDialog({
  open,
  onOpenChange,
  exercise,
  onSubmit,
}: ExerciseDialogProps) {
  const t = useTranslations();
  const isEditing = Boolean(exercise);

  // Radix unmounts DialogContent (and everything below it) whenever the
  // dialog is closed, so these initializers naturally re-seed the form
  // with the current `exercise` prop each time it opens — no effect needed.
  const [name, setName] = React.useState(exercise?.name ?? "");
  const [category, setCategory] = React.useState<ExerciseCategory | "">(
    exercise?.category ?? "",
  );
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t.exercises.dialog.errors.nameRequired);
      return;
    }

    if (!category) {
      setError(t.exercises.dialog.errors.categoryRequired);
      return;
    }

    onSubmit({ name: trimmedName, category });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t.exercises.dialog.editTitle : t.exercises.dialog.addTitle}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t.exercises.dialog.editDescription
                : t.exercises.dialog.addDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="exercise-name">{t.exercises.dialog.nameLabel}</Label>
            <Input
              id="exercise-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder={t.exercises.dialog.namePlaceholder}
              aria-invalid={Boolean(error)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="exercise-category">{t.exercises.dialog.categoryLabel}</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value as ExerciseCategory);
                if (error) setError(null);
              }}
            >
              <SelectTrigger id="exercise-category" aria-invalid={Boolean(error)}>
                <SelectValue placeholder={t.exercises.dialog.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {translateCategory(item, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit">
              {isEditing ? t.exercises.dialog.submitEdit : t.exercises.dialog.submitAdd}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
