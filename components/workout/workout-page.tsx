"use client";

import * as React from "react";
import { CheckCircle2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddExerciseDialog } from "@/components/workout/add-exercise-dialog";
import { RemoveExerciseDialog } from "@/components/workout/remove-exercise-dialog";
import { WorkoutExerciseCard } from "@/components/workout/workout-exercise-card";
import type { ClientExercise } from "@/components/workout/types";
import { saveWorkoutAction } from "@/lib/actions/workouts";
import type {
  SaveWorkoutExerciseInput,
  SaveWorkoutSetInput,
} from "@/lib/actions/workouts";
import type { Exercise } from "@/lib/exercises";
import type { Workout } from "@/lib/types/workout";
import { useTranslations } from "@/lib/i18n/locale-context";
import type { Dictionary } from "@/lib/i18n/translations";

interface WorkoutPageProps {
  initialWorkout: Workout | null;
  userExercises: Exercise[];
  todayDisplayDate: string;
}

function buildInitialExercises(
  workout: Workout | null,
  userExercises: Exercise[],
): ClientExercise[] {
  if (!workout) return [];

  const exerciseNameById = new Map(
    userExercises.map((exercise) => [exercise.id, exercise.name]),
  );

  return workout.exercises
    // An exercise saved in a past workout may since have been deleted from
    // the user's exercise list — drop it here rather than show a broken
    // entry; re-saving today's workout will then reflect that.
    .filter((exercise) => exerciseNameById.has(exercise.exerciseId))
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exerciseNameById.get(exercise.exerciseId) ?? "",
      sets: exercise.sets.map((set) => ({
        id: set.id,
        weight: String(set.weight),
        reps: String(set.reps),
      })),
    }));
}

function parseWeightInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function parseRepsInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || !/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value <= 0) return null;
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

      sets.push({ id: set.id, weight, reps });
    }

    payload.push({ exerciseId: exercise.exerciseId, sets });
  }

  return { ok: true, payload };
}

export function WorkoutPage({
  initialWorkout,
  userExercises,
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
  const [justAddedSetId, setJustAddedSetId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

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
    setExercises((current) => [
      ...current,
      { exerciseId: exercise.id, exerciseName: exercise.name, sets: [] },
    ]);
    setAddDialogOpen(false);
    clearFeedback();
  }

  function handleAddSet(exerciseId: string) {
    const newSetId = crypto.randomUUID();
    setExercises((current) =>
      current.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: [...exercise.sets, { id: newSetId, weight: "", reps: "" }],
            }
          : exercise,
      ),
    );
    setJustAddedSetId(newSetId);
    clearFeedback();
  }

  function handleChangeSetWeight(exerciseId: string, setId: string, value: string) {
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

  function handleConfirmRemoveExercise(exercise: ClientExercise) {
    setExercises((current) =>
      current.filter((item) => item.exerciseId !== exercise.exerciseId),
    );
    setRemoveTarget(null);
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
            {exercises.map((exercise) => (
              <WorkoutExerciseCard
                key={exercise.exerciseId}
                exercise={exercise}
                justAddedSetId={justAddedSetId}
                onChangeSetWeight={(setId, value) =>
                  handleChangeSetWeight(exercise.exerciseId, setId, value)
                }
                onChangeSetReps={(setId, value) =>
                  handleChangeSetReps(exercise.exerciseId, setId, value)
                }
                onDeleteSet={(setId) =>
                  handleDeleteSet(exercise.exerciseId, setId)
                }
                onAddSet={() => handleAddSet(exercise.exerciseId)}
                onRequestRemove={() => setRemoveTarget(exercise)}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleSave}
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
