"use client";

import { LayoutList } from "lucide-react";

import { categoryMeta } from "@/components/workout/workout-ui";
import { EXERCISE_CATEGORIES, type ExerciseCategory } from "@/lib/exercises";
import { translateCategory } from "@/lib/i18n/categories";
import { useTranslations } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export type CategoryFilterValue = ExerciseCategory | "all";

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

const CHIP =
  "inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-xl border pr-3.5 pl-2 text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:active:scale-100";

/** Single-row category filter. Scrolls sideways (never wraps) and bleeds to
 * the screen edge on phones. Pure UI state: the parent filters its own data. */
export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const t = useTranslations();

  return (
    <div
      role="group"
      aria-label={t.exercises.filters.label}
      className="-mx-0 flex snap-x gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        aria-pressed={value === "all"}
        onClick={() => onChange("all")}
        className={cn(
          CHIP,
          value === "all"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-current/20 bg-current/10"
        >
          <LayoutList className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        {t.exercises.filters.all}
      </button>

      {EXERCISE_CATEGORIES.map((category) => {
        const { icon: Icon, tile } = categoryMeta(category);
        const isActive = value === category;

        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(category)}
            className={cn(
              CHIP,
              isActive
                ? cn(tile, "text-foreground")
                : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", tile)}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            {translateCategory(category, t)}
          </button>
        );
      })}
    </div>
  );
}
