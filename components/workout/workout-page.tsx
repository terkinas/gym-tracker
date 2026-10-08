"use client";

import * as React from "react";
import { CalendarDays, CheckCircle2, Dumbbell, Pencil, Plus, Save, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompletedExerciseRow } from "@/components/workout/completed-exercise-row";
import { AddExerciseDialog } from "@/components/workout/add-exercise-dialog";
import { REPS_MAX, REPS_MIN } from "@/components/workout/reps-picker";
import {
  WEIGHT_MAX,
  WEIGHT_MIN,
  WEIGHT_STEP,
  isValidWeight,
} from "@/components/workout/weight-picker";
import { RemoveExerciseDialog } from "@/components/workout/remove-exercise-dialog";
import { WorkoutExerciseCard } from "@/components/workout/workout-exercise-card";
import type { ClientExercise } from "@/components/workout/types";
import { saveBodyWeightAction } from "@/lib/actions/body-weight";
import {
  clearTodayWorkoutAction,
  saveWorkoutAction,
  setExerciseCompletedAction,
} from "@/lib/actions/workouts";
import type {
  SaveWorkoutExerciseInput,
  SaveWorkoutSetInput,
} from "@/lib/actions/workouts";
import type { Exercise } from "@/lib/exercises";
import type { LastExerciseSession } from "@/lib/storage/workouts";
import type { SetHand, Workout } from "@/lib/types/workout";
import { generateId } from "@/lib/uuid";
import { parseBodyWeightInput } from "@/lib/workout/body-weight";
import { formatCount } from "@/lib/i18n/format";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";
import type { Dictionary } from "@/lib/i18n/translations";

interface WorkoutPageProps {
  initialWorkout: Workout | null;
  userExercises: Exercise[];
  /** Read-only "last time" info per exerciseId; never touches workout state. */
  lastTimeByExerciseId: Record<string, LastExerciseSession>;
  todayDisplayDate: string;
  /** The user's saved body weight (kg), or null. Independent of any workout. */
  initialBodyWeight: number | null;
}

function buildInitialExercises(
  workout: Workout | null,
  userExercises: Exercise[],
): ClientExercise[] {
  if (!workout) return [];

  const exerciseById = new Map(
    userExercises.map((exercise) => [exercise.id, exercise]),
  );

  return workout.exercises
    // An exercise saved in a past workout may since have been deleted from
    // the user's exercise list — drop it here rather than show a broken
    // entry; re-saving today's workout will then reflect that.
    .filter((exercise) => exerciseById.has(exercise.exerciseId))
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exerciseById.get(exercise.exerciseId)?.name ?? "",
      isOneHanded: exerciseById.get(exercise.exerciseId)?.isOneHanded ?? false,
      // Restored from WorkoutExercise.completed so a finished exercise stays
      // finished after a refresh.
      isDone: exercise.completed,
      usesBodyweight: exercise.usesBodyweight,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        weight: String(set.weight),
        reps: String(set.reps),
        hand: set.hand,
        isHardSet: set.isHardSet,
      })),
    }));
}

/** Default KG + REPS for the FIRST set of an exercise, taken from the last
 * set of its most recent earlier session ("Last Time"). Purely a suggestion:
 * both values stay fully editable, and `hand` is never part of it.
 *
 * Returns null (→ the usual empty defaults) when there is no usable history,
 * or when the earlier session counted weight differently (bodyweight extra
 * weight vs. plain weight), since the numbers wouldn't mean the same thing.
 * Legacy values that aren't on the wheels (e.g. 62.5 kg) are snapped to the
 * nearest wheel step instead of producing a set that fails validation. */
function getLastTimeDefaults(
  lastTime: LastExerciseSession | null | undefined,
  usesBodyweight: boolean,
): { weight: string; reps: string } | null {
  if (!lastTime || lastTime.usesBodyweight !== usesBodyweight) return null;
  const lastSet = lastTime.sets[lastTime.sets.length - 1];
  if (!lastSet) return null;

  const weight = Math.min(
    WEIGHT_MAX,
    Math.max(WEIGHT_MIN, Math.round(lastSet.weight / WEIGHT_STEP) * WEIGHT_STEP),
  );
  const reps = Math.min(REPS_MAX, Math.max(REPS_MIN, Math.round(lastSet.reps)));
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null;

  return { weight: String(weight), reps: String(reps) };
}

function parseWeightInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  // Must be on the weight wheel: 0–200 kg in 2.5 kg steps.
  if (!isValidWeight(value)) return null;
  return value;
}

function parseRepsInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || !/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value <= 0 || value > REPS_MAX) return null;
  return value;
}

function buildValidatedPayload(
  exercises: ClientExercise[],
  t: Dictionary,
):
  | { ok: true; payload: SaveWorkoutExerciseInput[] }
  | { ok: false; message: string } {
  const payload: SaveWorkoutExerciseInput[] = [];

  for (const exercise of exercises) {
    const sets: SaveWorkoutSetInput[] = [];

    for (let index = 0; index < exercise.sets.length; index += 1) {
      const set = exercise.sets[index];
      const weight = parseWeightInput(set.weight);
      const reps = parseRepsInput(set.reps);

      if (weight === null || reps === null) {
        return {
          ok: false,
          message: t.workout.validation.invalidSet(exercise.exerciseName, index + 1),
        };
      }

      // Individual-exercise sets must say which side they were done on, so a
      // set is never silently assumed to be left/right/both.
      if (exercise.isOneHanded && set.hand === null) {
        return {
          ok: false,
          message: t.workout.validation.handRequired(exercise.exerciseName, index + 1),
        };
      }

      sets.push({
        id: set.id,
        weight,
        reps,
        hand: exercise.isOneHanded ? set.hand : null,
        isHardSet: set.isHardSet,
      });
    }

    payload.push({
      exerciseId: exercise.exerciseId,
      completed: exercise.isDone,
      usesBodyweight: exercise.usesBodyweight,
      sets,
    });
  }

  return { ok: true, payload };
}

export function WorkoutPage({
  initialWorkout,
  userExercises,
  lastTimeByExerciseId,
  todayDisplayDate,
  initialBodyWeight,
}: WorkoutPageProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [exercises, setExercises] = React.useState<ClientExercise[]>(() =>
    buildInitialExercises(initialWorkout, userExercises),
  );
  // Body weight is a user-level setting, NOT part of the workout: it has its
  // own input + Save button and is never saved by the workout save actions.
  // `savedBodyWeight` is what is stored in PostgreSQL (and what bodyweight
  // exercises use); `bodyWeightInput` is the raw text being edited.
  const [savedBodyWeight, setSavedBodyWeight] = React.useState<number | null>(initialBodyWeight);
  const [bodyWeightInput, setBodyWeightInput] = React.useState<string>(
    initialBodyWeight !== null ? String(initialBodyWeight) : "",
  );
  const [isSavingBodyWeight, setIsSavingBodyWeight] = React.useState(false);
  // UI-only: once a body weight is saved it is shown as a compact line; this
  // flips it to the input while the user edits. Never persisted.
  const [isEditingBodyWeight, setIsEditingBodyWeight] = React.useState(false);
  const [bodyWeightFeedback, setBodyWeightFeedback] = React.useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<ClientExercise | null>(
    null,
  );
  // UI-only: the exercise being worked on right now (shows the NOW badge).
  // Never saved. Cleared when that exercise is marked done or removed.
  // UI only: category per exercise id (accent colour + icon on the cards).
  const categoryByExerciseId = React.useMemo(
    () => new Map(userExercises.map((exercise) => [exercise.id, exercise.category] as const)),
    [userExercises],
  );
  const [activeExerciseId, setActiveExerciseId] = React.useState<string | null>(null);
  const [justAddedSetId, setJustAddedSetId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  // Which exercise's "Done" is mid-save, so only that button shows the spinner.
  const [savingDoneId, setSavingDoneId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  // `isDone` is only a state flag: every exercise is always rendered and
  // stays fully editable, whether or not it is marked done.
  const hasExercises = exercises.length > 0;
  const addedExerciseIds = new Set(exercises.map((exercise) => exercise.exerciseId));
  const availableExercises = userExercises.filter(
    (exercise) => !addedExerciseIds.has(exercise.id),
  );

  function clearFeedback() {
    setError(null);
    setSuccessMessage(null);
  }

  function handleSelectExercise(exercise: Exercise) {
    // Newest exercise goes to the TOP of the list. Save order follows array
    // order, so a reload shows the same order the user saw.
    setExercises((current) => [
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        isOneHanded: exercise.isOneHanded,
        isDone: false,
        usesBodyweight: false,
        sets: [],
      },
      ...current,
    ]);
    setActiveExerciseId(exercise.id);
    setAddDialogOpen(false);
    clearFeedback();
  }

  function handleAddSet(exerciseId: string) {
    const newSetId = generateId();
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) return exercise;
        // Start from the previous set's values so the user only has to nudge
        // weight/reps (and the side, for individual exercises) instead of
        // re-entering everything. The FIRST set of an exercise instead starts
        // from the last set of its most recent earlier session (Last Time),
        // and stays empty when there is no history. The side is never guessed
        // from history: individual exercises still require choosing it.
        const previous = exercise.sets[exercise.sets.length - 1];
        const fromHistory = previous
          ? null
          : getLastTimeDefaults(
              lastTimeByExerciseId[exerciseId],
              exercise.usesBodyweight,
            );
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: newSetId,
              weight: previous?.weight ?? fromHistory?.weight ?? "",
              reps: previous?.reps ?? fromHistory?.reps ?? "",
              hand: previous?.hand ?? null,
              isHardSet: previous?.isHardSet ?? true,
            },
          ],
        };
      }),
    );
    setJustAddedSetId(newSetId);
    setActiveExerciseId(exerciseId);
    clearFeedback();
  }

  function handleChangeSetWeight(exerciseId: string, setId: string, value: string) {
    setActiveExerciseId(exerciseId);
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, weight: value } : set,
              ),
            }
          : exercise,
      ),
    );
    clearFeedback();
  }

  function handleChangeSetReps(exerciseId: string, setId: string, value: string) {
    setActiveExerciseId(exerciseId);
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, reps: value } : set,
              ),
            }
          : exercise,
      ),
    );
    clearFeedback();
  }

  function handleChangeSetHand(exerciseId: string, setId: string, value: SetHand) {
    setActiveExerciseId(exerciseId);
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, hand: value } : set,
              ),
            }
          : exercise,
      ),
    );
    clearFeedback();
  }

  function handleChangeSetHardSet(exerciseId: string, setId: string, value: boolean) {
    setActiveExerciseId(exerciseId);
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, isHardSet: value } : set,
              ),
            }
          : exercise,
      ),
    );
    clearFeedback();
  }

  function handleChangeUsesBodyweight(exerciseId: string, value: boolean) {
    setActiveExerciseId(exerciseId);
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, usesBodyweight: value } : exercise,
      ),
    );
    clearFeedback();
  }

  function handleDeleteSet(exerciseId: string, setId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
          : exercise,
      ),
    );
    clearFeedback();
  }

  // Persists the completed flag for an exercise that is already saved in
  // today's workout. For an exercise that isn't saved yet the server writes
  // nothing (no autosave) and the flag is sent with the next explicit Save.
  // On failure the optimistic change is rolled back.
  async function persistCompleted(exerciseId: string, completed: boolean) {
    try {
      await setExerciseCompletedAction(exerciseId, completed);
    } catch {
      setExercises((current) =>
        current.map((exercise) =>
          exercise.exerciseId === exerciseId
            ? { ...exercise, isDone: !completed }
            : exercise,
        ),
      );
      setError(t.workout.validation.saveFailed);
    }
  }

  // Saves the ENTIRE workout (with this exercise flagged completed) through
  // the same `saveWorkoutAction` the manual Save button uses. The exercise
  // only collapses once the save has succeeded; on failure it stays editable.
  async function handleDoneExercise(exerciseId: string) {
    if (isSaving) return;
    if (!exercises.some((exercise) => exercise.exerciseId === exerciseId)) return;
    clearFeedback();

    const result = buildValidatedPayload(
      exercises.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, isDone: true } : exercise,
      ),
      t,
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setIsSaving(true);
    setSavingDoneId(exerciseId);
    try {
      await saveWorkoutAction(result.payload);
      setExercises((current) =>
        current.map((exercise) =>
          exercise.exerciseId === exerciseId ? { ...exercise, isDone: true } : exercise,
        ),
      );
      setActiveExerciseId((current) => (current === exerciseId ? null : current));
    } catch {
      setError(t.workout.validation.saveFailed);
    } finally {
      setIsSaving(false);
      setSavingDoneId(null);
    }
  }

  function handleReopenExercise(id: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === id ? { ...exercise, isDone: false } : exercise,
      ),
    );
    setActiveExerciseId(id);
    void persistCompleted(id, false);
  }

  // Removing an exercise only changes the screen until the next Save — EXCEPT
  // when it was the last one. A workout with nothing left in it must not stay
  // in the database (it would keep showing up in the history calendar, history
  // list, progress and records), so removing the last exercise also deletes
  // today's saved workout on the server straight away. If that fails the
  // exercise is put back in its place, so the screen never claims the workout
  // is empty while the database still holds it.
  async function handleConfirmRemoveExercise(exercise: ClientExercise) {
    const removedIndex = exercises.findIndex((item) => item.exerciseId === exercise.exerciseId);
    const removed = removedIndex === -1 ? null : exercises[removedIndex];

    setExercises((current) =>
      current.filter((item) => item.exerciseId !== exercise.exerciseId),
    );
    setRemoveTarget(null);
    setActiveExerciseId((current) => (current === exercise.exerciseId ? null : current));
    clearFeedback();

    // Only removing the last exercise leaves the workout blank.
    if (removed === null || exercises.length !== 1) return;

    try {
      await clearTodayWorkoutAction();
    } catch {
      setExercises((current) =>
        current.some((item) => item.exerciseId === removed.exerciseId)
          ? current
          : [...current.slice(0, removedIndex), removed, ...current.slice(removedIndex)],
      );
      setError(t.workout.validation.saveFailed);
    }
  }

  // Parsed view of the input: drives the Save button (enabled only when the
  // text differs from what is stored) and validation.
  const parsedBodyWeight = parseBodyWeightInput(bodyWeightInput);
  const bodyWeightDirty = !parsedBodyWeight.ok || parsedBodyWeight.value !== savedBodyWeight;
  function handleStartEditBodyWeight() {
    setBodyWeightInput(savedBodyWeight !== null ? String(savedBodyWeight) : "");
    setBodyWeightFeedback(null);
    setIsEditingBodyWeight(true);
  }

  function handleCancelEditBodyWeight() {
    setBodyWeightInput(savedBodyWeight !== null ? String(savedBodyWeight) : "");
    setBodyWeightFeedback(null);
    setIsEditingBodyWeight(false);
  }

  // Saves ONLY when the user presses Save (or Enter) — never per keystroke.
  async function handleSaveBodyWeight(event: React.FormEvent) {
    event.preventDefault();
    if (isSavingBodyWeight) return;
    setBodyWeightFeedback(null);

    if (!parsedBodyWeight.ok) {
      setBodyWeightFeedback({ type: "error", text: t.workout.bodyWeight.invalid });
      return;
    }

    setIsSavingBodyWeight(true);
    try {
      const stored = await saveBodyWeightAction(parsedBodyWeight.value);
      setSavedBodyWeight(stored);
      // Show the normalised stored value (e.g. "82,5" -> "82.5").
      setBodyWeightInput(stored !== null ? String(stored) : "");
      setBodyWeightFeedback({ type: "success", text: t.workout.bodyWeight.saved });
      // Back to the compact line (or the input again if the field was cleared).
      setIsEditingBodyWeight(false);
    } catch {
      setBodyWeightFeedback({ type: "error", text: t.workout.bodyWeight.saveFailed });
    } finally {
      setIsSavingBodyWeight(false);
    }
  }

  // The master Save button. Besides saving the whole workout it also finishes
  // every exercise that is still open and has sets logged, exactly like "I'm
  // done with this exercise" does: they are flagged completed in the saved
  // payload and, once the save has succeeded, collapse into the compact row
  // (which also moves the done counter). An open exercise with no sets yet is
  // saved as-is but is NOT marked done — there is nothing to finish. On
  // failure nothing collapses and every exercise stays editable.
  async function handleSave() {
    if (isSaving) return;
    clearFeedback();

    if (exercises.length === 0) {
      setError(t.workout.validation.emptyWorkout);
      return;
    }

    const idsToFinish = new Set(
      exercises
        .filter((exercise) => !exercise.isDone && exercise.sets.length > 0)
        .map((exercise) => exercise.exerciseId),
    );

    const result = buildValidatedPayload(
      exercises.map((exercise) =>
        idsToFinish.has(exercise.exerciseId) ? { ...exercise, isDone: true } : exercise,
      ),
      t,
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setIsSaving(true);
    try {
      await saveWorkoutAction(result.payload);
      if (idsToFinish.size > 0) {
        // Only flip what was actually part of this save, so an exercise added
        // or re-opened while the request was in flight is left alone.
        setExercises((current) =>
          current.map((exercise) =>
            idsToFinish.has(exercise.exerciseId) ? { ...exercise, isDone: true } : exercise,
          ),
        );
        setActiveExerciseId((current) =>
          current !== null && idsToFinish.has(current) ? null : current,
        );
      }
      setSuccessMessage(t.workout.saved);
    } catch {
      setError(t.workout.validation.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  const doneCount = exercises.filter((exercise) => exercise.isDone).length;

  // Same messages as before; shown inside the sticky action bar while the
  // workout has exercises, so a save result is never out of sight.
  const feedback = (
    <>
      {error && (
        <p role="alert" className="px-1 text-sm text-destructive">
          {error}
        </p>
      )}
      {successMessage && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 px-1 text-sm text-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
          {successMessage}
        </p>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <header className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{todayDisplayDate}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t.workout.pageTitle}
          </h1>
        </div>

        {hasExercises && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums">
            <CheckCircle2
              className={`h-3.5 w-3.5 ${doneCount > 0 ? "text-primary" : ""}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {doneCount}/{exercises.length}
          </span>
        )}
      </header>

      <div className="flex flex-col gap-1.5">
        {savedBodyWeight !== null && !isEditingBodyWeight ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 py-1 pr-1.5 pl-3 sm:w-fit sm:justify-start sm:gap-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {t.workout.bodyWeight.label}:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatCount(savedBodyWeight, locale)} {t.records.units.kg}
                </span>
              </span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStartEditBodyWeight}
              className="h-10 rounded-lg px-3 text-muted-foreground transition-transform duration-150 hover:text-foreground active:scale-[0.97]"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t.workout.bodyWeight.edit}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSaveBodyWeight}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
          >
            <Label
              htmlFor="body-weight"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <Scale className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {t.workout.bodyWeight.label}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="body-weight"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                autoFocus={isEditingBodyWeight}
                maxLength={5}
                value={bodyWeightInput}
                onChange={(event) => {
                  setBodyWeightInput(event.target.value);
                  setBodyWeightFeedback(null);
                }}
                placeholder={t.workout.bodyWeight.placeholder}
                aria-invalid={bodyWeightFeedback?.type === "error" || undefined}
                className="h-11 w-24 rounded-xl text-right tabular-nums"
              />
              <span className="text-sm text-muted-foreground">{t.records.units.kg}</span>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              {savedBodyWeight !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEditBodyWeight}
                  disabled={isSavingBodyWeight}
                  className="h-11 rounded-xl text-muted-foreground"
                >
                  {t.common.cancel}
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                loading={isSavingBodyWeight}
                disabled={!bodyWeightDirty}
                className="h-11 rounded-xl"
              >
                {t.workout.bodyWeight.save}
              </Button>
            </div>
          </form>
        )}
        {bodyWeightFeedback && (
          <p
            role={bodyWeightFeedback.type === "error" ? "alert" : "status"}
            className={
              bodyWeightFeedback.type === "error"
                ? "px-1 text-sm text-destructive"
                : "px-1 text-xs text-muted-foreground"
            }
          >
            {bodyWeightFeedback.text}
          </p>
        )}
      </div>

      {!hasExercises && (error || successMessage) && (
        <div className="flex flex-col gap-2">{feedback}</div>
      )}

      {hasExercises ? (
        <>
          <div className="flex flex-col gap-3">
            {exercises.map((exercise) =>
              exercise.isDone ? (
                <CompletedExerciseRow
                  key={exercise.exerciseId}
                  exercise={exercise}
                  category={categoryByExerciseId.get(exercise.exerciseId)}
                  onReopen={() => handleReopenExercise(exercise.exerciseId)}
                />
              ) : (
                <WorkoutExerciseCard
                  key={exercise.exerciseId}
                  exercise={exercise}
                  category={categoryByExerciseId.get(exercise.exerciseId)}
                  lastTime={lastTimeByExerciseId[exercise.exerciseId] ?? null}
                  bodyWeight={savedBodyWeight}
                  isActive={exercise.exerciseId === activeExerciseId}
                  justAddedSetId={justAddedSetId}
                  onChangeSetWeight={(setId, value) =>
                    handleChangeSetWeight(exercise.exerciseId, setId, value)
                  }
                  onChangeSetReps={(setId, value) =>
                    handleChangeSetReps(exercise.exerciseId, setId, value)
                  }
                  onChangeSetHand={(setId, value) =>
                    handleChangeSetHand(exercise.exerciseId, setId, value)
                  }
                  onDeleteSet={(setId) => handleDeleteSet(exercise.exerciseId, setId)}
                  onChangeSetHardSet={(setId, value) =>
                    handleChangeSetHardSet(exercise.exerciseId, setId, value)
                  }
                  onChangeUsesBodyweight={(value) =>
                    handleChangeUsesBodyweight(exercise.exerciseId, value)
                  }
                  onAddSet={() => handleAddSet(exercise.exerciseId)}
                  onRequestRemove={() => setRemoveTarget(exercise)}
                  onDone={() => handleDoneExercise(exercise.exerciseId)}
                  isSavingDone={savingDoneId === exercise.exerciseId}
                  disabled={isSaving}
                />
              ),
            )}
          </div>

          {/* Thumb-reach action bar: sticks above the mobile bottom nav (and
              its safe-area inset), sits at the bottom of the viewport on
              desktop. Add exercise = primary; Save = quieter outline. */}
          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] z-30 flex flex-col gap-2 rounded-2xl border border-border bg-background/90 p-2 shadow-lg shadow-black/30 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:bottom-4 md:ml-auto md:w-fit">
            {(error || successMessage) && <div className="flex flex-col gap-1">{feedback}</div>}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setAddDialogOpen(true)}
                className="h-12 min-w-0 flex-[1.15] rounded-xl px-3 transition-transform duration-150 active:scale-[0.98] md:flex-none md:px-5"
              >
                <Plus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
                <span className="truncate">{t.workout.addExercise}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                loading={isSaving && savingDoneId === null}
                disabled={isSaving}
                className="h-12 min-w-0 flex-1 rounded-xl px-3 transition-transform duration-150 active:scale-[0.98] md:flex-none md:px-5"
              >
                {!(isSaving && savingDoneId === null) && (
                  <Save className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                )}
                <span className="truncate">
                  {isSaving ? (
                    t.workout.saveWorkoutPending
                  ) : (
                    <>
                      <span className="md:hidden">{t.workout.saveWorkoutShort}</span>
                      <span className="hidden md:inline">{t.workout.saveWorkout}</span>
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-4 py-14 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground"
          >
            <Dumbbell className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">{t.workout.emptyStateMessage}</p>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="h-12 rounded-xl px-5 transition-transform duration-150 active:scale-[0.98]"
          >
            <Plus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
            {t.workout.addExercise}
          </Button>
        </div>
      )}

      <AddExerciseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        availableExercises={availableExercises}
        hasAnyExercises={userExercises.length > 0}
        onSelect={handleSelectExercise}
      />

      <RemoveExerciseDialog
        exercise={removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={handleConfirmRemoveExercise}
      />
    </div>
  );
}
