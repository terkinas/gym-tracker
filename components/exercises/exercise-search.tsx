"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/locale-context";

interface ExerciseSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExerciseSearch({ value, onChange }: ExerciseSearchProps) {
  const t = useTranslations();

  return (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.common.searchExercise.placeholder}
        aria-label={t.common.searchExercise.label}
        className="h-13 rounded-none border-border bg-card pl-12 text-base shadow-none transition-colors focus-visible:border-primary/60 focus-visible:ring-primary/20 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}
