"use client";

import * as React from "react";
import { ArrowLeftRight, Dumbbell, Plus, Save, X } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { categoryMeta } from "@/components/workout/workout-ui";
import {
  EXERCISE_CATEGORIES,
  type Exercise,
  type ExerciseCategory,
  type ExerciseInput,
} from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";
import { cn } from "@/lib/utils";

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
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto overscroll-contain rounded-none p-5 sm:p-6">
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

  const submitLabel = isEditing ? t.exercises.dialog.submitEdit : t.exercises.dialog.submitAdd;
  const SubmitIcon = isEditing ? Save : Plus;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <DialogHeader className="pr-8">
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
        <div className="relative">
          <Dumbbell
            className="pointer-events-none absolute top-1/2 left-4 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <Input
            id="exercise-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(null);
            }}
            placeholder={t.exercises.dialog.namePlaceholder}
            aria-invalid={Boolean(error)}
            className="h-12 rounded-none pl-11 text-base shadow-none sm:text-sm"
            autoFocus
          />
        </div>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">
          {t.exercises.dialog.categoryLabel}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {EXERCISE_CATEGORIES.map((item) => {
            const { icon: Icon, tile } = categoryMeta(item);
            const isSelected = category === item;

            return (
              <button
                key={item}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setCategory(item);
                  // The primary muscle can't also be a secondary one.
                  setSecondaryMuscles((current) => current.filter((muscle) => muscle !== item));
                  if (error) setError(null);
                }}
                className={cn(
                  "flex min-h-12 min-w-0 items-center gap-2.5 rounded-none border px-2.5 py-1.5 text-left text-sm font-medium transition-[background-color,border-color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:active:scale-100",
                  isSelected
                    ? cn(tile, "text-foreground")
                    : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                  !category && error && "border-destructive/50",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-none border", tile)}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 truncate">{translateCategory(item, t)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          {t.exercises.dialog.secondaryLabel}
        </legend>
        <p className="text-xs text-muted-foreground">{t.exercises.dialog.secondaryHelp}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {EXERCISE_CATEGORIES.filter((muscle) => muscle !== category).map((muscle) => {
            const isSelected = secondaryMuscles.includes(muscle);
            const { tile } = categoryMeta(muscle);

            return (
              <button
                key={muscle}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  setSecondaryMuscles((current) =>
                    isSelected ? current.filter((item) => item !== muscle) : [...current, muscle],
                  )
                }
                className={cn(
                  "inline-flex h-10 items-center rounded-none border px-3.5 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? cn(tile, "text-foreground")
                    : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {translateCategory(muscle, t)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label
        htmlFor="exercise-one-handed"
        className="flex cursor-pointer items-center gap-3 rounded-none border border-border/60 bg-muted/20 p-3.5 transition-colors duration-150 hover:bg-muted/40"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-border bg-muted/30 text-muted-foreground"
        >
          <ArrowLeftRight className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span id="exercise-one-handed-label" className="text-sm font-medium text-foreground">
            {t.exercises.dialog.oneHandedLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            {t.exercises.dialog.oneHandedHelp}
          </span>
        </span>
        <Switch
          id="exercise-one-handed"
          checked={isOneHanded}
          onCheckedChange={setIsOneHanded}
          aria-labelledby="exercise-one-handed-label"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter className="gap-2.5">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
          className="h-12 rounded-none sm:h-11"
        >
          <X className="h-4 w-4" strokeWidth={2} />
          {t.common.cancel}
        </Button>
        <Button type="submit" loading={isSubmitting} className="h-12 rounded-none sm:h-11">
          {!isSubmitting && <SubmitIcon className="h-4 w-4" strokeWidth={2} />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
