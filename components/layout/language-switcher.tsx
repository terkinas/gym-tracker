"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { setLocaleAction } from "@/lib/i18n/actions";
import { useLocale, useTranslations } from "@/lib/i18n/locale-context";

interface LanguageSwitcherProps {
  className?: string;
}

/** Compact LT | EN toggle for switching the app's language. Always shows
 * the language codes as text (never relies on flag icons alone), exposes
 * the selected state visually and via `aria-pressed`, and is fully
 * keyboard-operable as a row of buttons. Persists the choice via a cookie
 * and re-renders the current route in the new language without logging
 * the user out or losing in-progress workout/exercise state. */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [isPending, startTransition] = React.useTransition();

  return (
    <div
      role="group"
      aria-label={t.languageSwitcher.label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-none border border-border bg-card p-0.5",
        className,
      )}
    >
      {SUPPORTED_LOCALES.map((code) => {
        const isActive = code === locale;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={isActive}
            aria-label={t.languageSwitcher[code]}
            disabled={isPending}
            onClick={() => {
              if (isActive) return;
              startTransition(() => {
                setLocaleAction(code);
              });
            }}
            className={cn(
              "rounded-none px-2 py-1 max-md:min-h-9 max-md:min-w-9 text-xs font-semibold tracking-wide uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
              isActive
                ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
