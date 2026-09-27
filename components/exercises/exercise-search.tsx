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
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
      />
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.common.searchExercise.placeholder}
        aria-label={t.common.searchExercise.label}
        className="pl-9"
      />
    </div>
  );
}
