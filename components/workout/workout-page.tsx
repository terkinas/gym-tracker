"use client";

import * as React from "react";
import { CheckCircle2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CompletedExerciseRow } from "@/components/workout/completed-exercise-row";
import { AddExerciseDialog } from "@/components/workout/add-exercise-dialog";
import { REPS_MAX } from "@/components/workout/reps-picker";
import { isValidWeight } from "@/components/workout/weight-picker";
import { RemoveExerciseDialog } from "@/components/workout/remove-exercise-dialog";
import { WorkoutExerciseCard } from "@/components/workout/workout-exercise-card";
import type { ClientExercise } from "@/components/workout/types";
import { saveWorkoutAction, setExerciseCompletedAction } from "@/lib/actions/workouts";
import type {
  SaveWorkoutExerciseInput,
  SaveWorkoutSetInput,
} from "@/lib/actions/workouts";
import type { Exercise } from "@/lib/exercises";
import type { LastExerciseSession } from "@/lib/storage/workouts";
import type { SetHand, Workout } from "@/lib/types/workout";
import { generateId } from "@/lib/uuid";
import { useTranslations } from "@/lib/i18n/locale-context";
import type { Dictionary } from "@/lib/i18n/translations";

interface WorkoutPageProps {
  initialWorkout: Workout | null;
  userExercises: Exercise[];
  /** Read-only "last time" info per exerciseId; never touches workout state. */
  lastTimeByExerciseId: Record<string, LastExerciseSession>;
  todayDisplayDate: string;
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
      sets: exercise.sets.map((set) => ({
        id: set.id,
        weight: String(set.weight),
        reps: String(set.reps),
        hand: set.hand,
        isHardSet: set.isHardSet,
      })),
    }));
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

      // One-handed sets must say which arm they were done with, so a set is
      // never silently assumed to be left/right/both.
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

    payload.push({ exerciseId: exercise.exerciseId, completed: exercise.isDone, sets });
  }

  return { ok: true, payload };
}

export function WorkoutPage({
  initialWorkout,
  userExercises,
  lastTimeByExerciseId,
  todayDisplayDate,
}: WorkoutPageProps) {
  const t = useTranslations();
  const [exercises, setExercises] = React.useState<ClientExercise[]>(() =>
    buildInitialExercises(initialWorkout, userExercises),
  );
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<ClientExercise | null>(
    null,
  );
  // UI-only: the exercise being worked on right now (shows the NOW badge).
  // Never saved. Cleared when that exercise is marked done or removed.
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
        // weight/reps (and the arm, for one-handed exercises) instead of
        // re-entering everything. The first set of an exercise stays empty.
        const previous = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: newSetId,
              weight: previous?.weight ?? "",
              reps: previous?.reps ?? "",
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

  function handleConfirmRemoveExercise(exercise: ClientExercise) {
    setExercises((current) =>
      current.filter((item) => item.exerciseId !== exercise.exerciseId),
    );
    setRemoveTarget(null);
    setActiveExerciseId((current) => (current === exercise.exerciseId ? null : current));
    clearFeedback();
  }

  async function handleSave() {
    if (isSaving) return;
    clearFeedback();

    if (exercises.length === 0) {
      setError(t.workout.validation.emptyWorkout);
      return;
    }

    const result = buildValidatedPayload(exercises, t);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setIsSaving(true);
    try {
      await saveWorkoutAction(result.payload);
      setSuccessMessage(t.workout.saved);
    } catch {
      setError(t.workout.validation.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t.workout.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {todayDisplayDate}
          </p>
        </div>

        {hasExercises && (
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t.workout.addExercise}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {successMessage && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
          {successMessage}
        </p>
      )}

      {hasExercises ? (
        <>
          <div className="flex flex-col gap-4">
            {exercises.map((exercise) =>
              exercise.isDone ? (
                <CompletedExerciseRow
                  key={exercise.exerciseId}
                  exercise={exercise}
                  onReopen={() => handleReopenExercise(exercise.exerciseId)}
                />
              ) : (
                <WorkoutExerciseCard
                  key={exercise.exerciseId}
                  exercise={exercise}
                  lastTime={lastTimeByExerciseId[exercise.exerciseId] ?? null}
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
                onDeleteSet={(setId) =>
                    handleDeleteSet(exercise.exerciseId, setId)
                  }
                  onChangeSetHardSet={(setId, value) =>
                    handleChangeSetHardSet(exercise.exerciseId, setId, value)
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

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleSave}
              loading={isSaving && savingDoneId === null}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? t.workout.saveWorkoutPending : t.workout.saveWorkout}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t.workout.emptyStateMessage}
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
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
