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
  type ExerciseInput,
} from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";

interface ExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise | null;
  onSubmit: (values: ExerciseInput) => void | Promise<void>;
}

export function ExerciseDialog({
  open,
  onOpenChange,
  exercise,
  onSubmit,
}: ExerciseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* The form state lives in ExerciseForm, which is rendered INSIDE
            DialogContent. Radix unmounts DialogContent when the dialog
            closes, so ExerciseForm remounts — and its useState initializers
            re-seed from the current `exercise` prop — every time the dialog
            opens. (State kept directly in ExerciseDialog would only be
            seeded once, because this component itself stays mounted.) The
            key additionally guarantees a reset if the target exercise
            changes while the dialog is open. */}
        <ExerciseForm
          key={exercise?.id ?? "new"}
          exercise={exercise}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ExerciseFormProps {
  exercise?: Exercise | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExerciseInput) => void | Promise<void>;
}

function ExerciseForm({ exercise, onOpenChange, onSubmit }: ExerciseFormProps) {
  const t = useTranslations();
  const isEditing = Boolean(exercise);

  const [name, setName] = React.useState(exercise?.name ?? "");
  const [category, setCategory] = React.useState<ExerciseCategory | "">(
    exercise?.category ?? "",
  );
  const [isOneHanded, setIsOneHanded] = React.useState(
    exercise?.isOneHanded ?? false,
  );
  const [secondaryMuscles, setSecondaryMuscles] = React.useState<ExerciseCategory[]>(
    exercise?.secondaryMuscles ?? [],
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t.exercises.dialog.errors.nameRequired);
      return;
    }

    if (!category) {
      setError(t.exercises.dialog.errors.categoryRequired);
      return;
    }

    // Keep the dialog open (with a spinner on the button) until the server
    // has answered; the parent reports failures on the page itself.
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: trimmedName,
        category,
        isOneHanded,
        secondaryMuscles: secondaryMuscles.filter((muscle) => muscle !== category),
      });
    } finally {
      setIsSubmitting(false);
    }
    onOpenChange(false);
  }

  return (
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
            // The primary muscle can't also be a secondary one.
            setSecondaryMuscles((current) => current.filter((muscle) => muscle !== value));
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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground">
          {t.exercises.dialog.secondaryLabel}
        </legend>
        <p className="text-xs text-muted-foreground">{t.exercises.dialog.secondaryHelp}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {EXERCISE_CATEGORIES.filter((muscle) => muscle !== category).map((muscle) => (
            <label key={muscle} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={secondaryMuscles.includes(muscle)}
                onChange={(event) =>
                  setSecondaryMuscles((current) =>
                    event.target.checked
                      ? [...current, muscle]
                      : current.filter((item) => item !== muscle),
                  )
                }
                className="h-4 w-4 cursor-pointer rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {translateCategory(muscle, t)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-start gap-3">
        <input
          id="exercise-one-handed"
          type="checkbox"
          checked={isOneHanded}
          onChange={(event) => setIsOneHanded(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <Label htmlFor="exercise-one-handed" className="cursor-pointer">
            {t.exercises.dialog.oneHandedLabel}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t.exercises.dialog.oneHandedHelp}
          </p>
        </div>
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
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
        >
          {t.common.cancel}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? t.exercises.dialog.submitEdit : t.exercises.dialog.submitAdd}
        </Button>
      </DialogFooter>
    </form>
  );
}
