"use client";

import * as React from "react";
import { CheckCircle2, Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { ExerciseDialog } from "@/components/exercises/exercise-dialog";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { DeleteExerciseDialog } from "@/components/exercises/delete-exercise-dialog";
import {
  createExerciseAction,
  deleteExerciseAction,
  importCityGymDefaultsAction,
  updateExerciseAction,
} from "@/lib/actions/exercises";
import {
  EXERCISE_CATEGORIES,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";

type DialogState =
  | { mode: "add" }
  | { mode: "edit"; exercise: Exercise }
  | null;

interface ExerciseListProps {
  initialExercises: Exercise[];
}

export function ExerciseList({ initialExercises }: ExerciseListProps) {
  const t = useTranslations();
  const [exercises, setExercises] = React.useState<Exercise[]>(initialExercises);
  const [query, setQuery] = React.useState("");
  const [dialogState, setDialogState] = React.useState<DialogState>(null);
  const [exerciseToDelete, setExerciseToDelete] = React.useState<Exercise | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const filteredExercises = isSearching
    ? exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(trimmedQuery),
      )
    : exercises;

  const hasAnyExercises = exercises.length > 0;
  const hasSearchResults = filteredExercises.length > 0;

  // While searching, only show categories that actually have a match —
  // otherwise every category (even ones with zero exercises) is shown.
  const visibleCategories = isSearching
    ? EXERCISE_CATEGORIES.filter((category) =>
        filteredExercises.some((exercise) => exercise.category === category),
      )
    : EXERCISE_CATEGORIES;

  async function handleAddExercise(values: { name: string; category: ExerciseCategory }) {
    try {
      const exercise = await createExerciseAction(values);
      setExercises((current) => [...current, exercise]);
      setError(null);
      setSuccessMessage(null);
    } catch {
      setError(t.exercises.errors.addFailed);
    }
  }

  async function handleImportCityGymDefaults() {
    if (isImporting) return;

    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const imported = await importCityGymDefaultsAction();
      setExercises(imported);
      setSuccessMessage(t.exercises.importSuccess);
    } catch {
      setError(t.exercises.errors.importFailed);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleUpdateExercise(
    id: string,
    values: { name: string; category: ExerciseCategory },
  ) {
    try {
      const updated = await updateExerciseAction(id, values);
      setExercises((current) =>
        current.map((exercise) => (exercise.id === id ? updated : exercise)),
      );
      setError(null);
    } catch {
      setError(t.exercises.errors.updateFailed);
    }
  }

  async function handleDeleteExercise(exercise: Exercise) {
    try {
      await deleteExerciseAction(exercise.id);
      setExercises((current) => current.filter((item) => item.id !== exercise.id));
      setError(null);
    } catch {
      setError(t.exercises.errors.deleteFailed);
    } finally {
      setExerciseToDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t.exercises.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t.exercises.pageSubtitle}
          </p>
        </div>

        <Button
          onClick={() => setDialogState({ mode: "add" })}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {t.exercises.addExercise}
        </Button>
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

      {hasAnyExercises ? (
        <>
          <ExerciseSearch value={query} onChange={setQuery} />

          {isSearching && !hasSearchResults ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {t.exercises.noSearchResults}
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {visibleCategories.map((category) => {
                const categoryExercises = filteredExercises.filter(
                  (exercise) => exercise.category === category,
                );

                return (
                  <section key={category} className="flex flex-col gap-3">
                    <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                      {translateCategory(category, t)}
                    </h2>

                    {categoryExercises.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {categoryExercises.map((exercise) => (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            onEdit={(item) =>
                              setDialogState({ mode: "edit", exercise: item })
                            }
                            onDelete={setExerciseToDelete}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-border px-4 py-3.5 text-sm text-muted-foreground">
                        {t.exercises.categoryEmpty}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t.exercises.noExercisesYet}
          </p>
          <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
            <Button onClick={() => setDialogState({ mode: "add" })}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t.exercises.addFirstExercise}
            </Button>
            <Button
              variant="outline"
              onClick={handleImportCityGymDefaults}
              disabled={isImporting}
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              {isImporting
                ? t.exercises.importCityGymDefaultsPending
                : t.exercises.importCityGymDefaults}
            </Button>
          </div>
        </div>
      )}

      <ExerciseDialog
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        exercise={dialogState?.mode === "edit" ? dialogState.exercise : null}
        onSubmit={(values) => {
          if (dialogState?.mode === "edit") {
            handleUpdateExercise(dialogState.exercise.id, values);
          } else {
            handleAddExercise(values);
          }
        }}
      />

      <DeleteExerciseDialog
        exercise={exerciseToDelete}
        onOpenChange={(open) => {
          if (!open) setExerciseToDelete(null);
        }}
        onConfirm={handleDeleteExercise}
      />
    </div>
  );
}
