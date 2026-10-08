"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Dumbbell, LibraryBig, Plus, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryFilter, type CategoryFilterValue } from "@/components/exercises/category-filter";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { ExerciseDialog } from "@/components/exercises/exercise-dialog";
import { ExerciseSearch } from "@/components/exercises/exercise-search";
import { DeleteExerciseDialog } from "@/components/exercises/delete-exercise-dialog";
import { categoryMeta } from "@/components/workout/workout-ui";
import {
  createExerciseAction,
  deleteExerciseAction,
  importCityGymDefaultsAction,
  updateExerciseAction,
} from "@/lib/actions/exercises";
import {
  EXERCISE_CATEGORIES,
  type Exercise,
  type ExerciseInput,
} from "@/lib/exercises";
import { useTranslations } from "@/lib/i18n/locale-context";
import { translateCategory } from "@/lib/i18n/categories";
import { cn } from "@/lib/utils";

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
  const [isDeleting, setIsDeleting] = React.useState(false);
  // UI-only state: category filter, plus ids used for the add/delete animations.
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilterValue>("all");
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  const [leavingIds, setLeavingIds] = React.useState<string[]>([]);

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const filteredExercises = exercises.filter(
    (exercise) =>
      (activeCategory === "all" || exercise.category === activeCategory) &&
      (!isSearching || exercise.name.toLowerCase().includes(trimmedQuery)),
  );

  const hasAnyExercises = exercises.length > 0;
  const hasSearchResults = filteredExercises.length > 0;

  // While searching, only show categories that actually have a match —
  // otherwise every category (even ones with zero exercises) is shown.
  const visibleCategories =
    activeCategory !== "all"
      ? [activeCategory]
      : isSearching
        ? EXERCISE_CATEGORIES.filter((category) =>
            filteredExercises.some((exercise) => exercise.category === category),
          )
        : EXERCISE_CATEGORIES;

  async function handleAddExercise(values: ExerciseInput) {
    try {
      const exercise = await createExerciseAction(values);
      setExercises((current) => [...current, exercise]);
      // Make sure the new row is actually visible, then outline it briefly.
      if (activeCategory !== "all" && activeCategory !== exercise.category) {
        setActiveCategory("all");
      }
      if (query.trim() && !exercise.name.toLowerCase().includes(query.trim().toLowerCase())) {
        setQuery("");
      }
      setHighlightedId(exercise.id);
      window.setTimeout(() => setHighlightedId((id) => (id === exercise.id ? null : id)), 1800);
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
    values: ExerciseInput,
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
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteExerciseAction(exercise.id);
      // Fade the row out first, then drop it from the list.
      setLeavingIds((current) => [...current, exercise.id]);
      window.setTimeout(() => {
        setExercises((current) => current.filter((item) => item.id !== exercise.id));
        setLeavingIds((current) => current.filter((id) => id !== exercise.id));
      }, 200);
      setError(null);
    } catch {
      setError(t.exercises.errors.deleteFailed);
    } finally {
      setIsDeleting(false);
      setExerciseToDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <header className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            <Dumbbell className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{t.exercises.count(exercises.length)}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t.exercises.pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.exercises.pageSubtitle}</p>
        </div>

        <Button
          onClick={() => setDialogState({ mode: "add" })}
          className="h-11 shrink-0 rounded-xl px-4 transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100 sm:px-5"
        >
          <Plus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
          {t.exercises.addExercise}
        </Button>
      </header>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" strokeWidth={1.75} />
          {error}
        </p>
      )}

      {successMessage && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
          {successMessage}
        </p>
      )}

      {hasAnyExercises ? (
        <>
          <div className="flex flex-col gap-3">
            <ExerciseSearch value={query} onChange={setQuery} />
            <CategoryFilter value={activeCategory} onChange={setActiveCategory} />
          </div>

          {isSearching && !hasSearchResults ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground"
              >
                <SearchX className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <p className="text-sm text-muted-foreground">{t.exercises.noSearchResults}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {visibleCategories.map((category) => {
                const categoryExercises = filteredExercises.filter(
                  (exercise) => exercise.category === category,
                );
                const { icon: CategoryIcon, tile } = categoryMeta(category);

                return (
                  <section key={category} className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg border",
                          tile,
                        )}
                      >
                        <CategoryIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </span>
                      {translateCategory(category, t)}
                      <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[0.7rem] leading-4 font-medium tracking-normal text-muted-foreground normal-case tabular-nums">
                        {categoryExercises.length}
                      </span>
                    </h2>

                    {categoryExercises.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {categoryExercises.map((exercise) => (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            isHighlighted={highlightedId === exercise.id}
                            isLeaving={leavingIds.includes(exercise.id)}
                            onEdit={(item) =>
                              setDialogState({ mode: "edit", exercise: item })
                            }
                            onDelete={setExerciseToDelete}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-border px-4 py-3.5 text-sm text-muted-foreground">
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
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border px-4 py-14 text-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground"
          >
            <Dumbbell className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">{t.exercises.noExercisesYet}</p>

          <div className="flex w-full max-w-xs flex-col items-stretch gap-4">
            <Button
              onClick={() => setDialogState({ mode: "add" })}
              className="h-12 rounded-xl transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              <Plus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
              {t.exercises.addFirstExercise}
            </Button>

            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs tracking-wider text-muted-foreground uppercase">
                {t.exercises.or}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col items-stretch gap-2">
              <Button
                variant="outline"
                onClick={handleImportCityGymDefaults}
                loading={isImporting}
                className="h-12 rounded-xl transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
              >
                {!isImporting && <LibraryBig className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />}
                {isImporting
                  ? t.exercises.importCityGymDefaultsPending
                  : t.exercises.importCityGymDefaults}
              </Button>
              <p className="text-xs text-muted-foreground">{t.exercises.importHelp}</p>
            </div>
          </div>
        </div>
      )}

      <ExerciseDialog
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        exercise={dialogState?.mode === "edit" ? dialogState.exercise : null}
        onSubmit={(values) =>
          dialogState?.mode === "edit"
            ? handleUpdateExercise(dialogState.exercise.id, values)
            : handleAddExercise(values)
        }
      />

      <DeleteExerciseDialog
        exercise={exerciseToDelete}
        onOpenChange={(open) => {
          if (!open) setExerciseToDelete(null);
        }}
        onConfirm={handleDeleteExercise}
        isDeleting={isDeleting}
      />
    </div>
  );
}
