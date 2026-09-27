"use client";

import * as React from "react";

import { translations } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/translations";

type LocaleContextValue = { locale: Locale; t: Dictionary };

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  locale: Locale;
  children: React.ReactNode;
}

/** Makes the current locale (resolved server-side, from the language
 * cookie) available to every Client Component in the tree. Wraps the app
 * once, in the root layout — switching languages re-renders the Server
 * Component tree with a new `locale` prop (see `lib/i18n/actions.ts`),
 * which flows down through here automatically. */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = React.useMemo<LocaleContextValue>(
    () => ({ locale, t: translations[locale] }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error("useTranslations/useLocale must be used within a LocaleProvider");
  }
  return context;
}

/** Client Component hook returning the active locale's translation
 * dictionary, e.g. `const t = useTranslations(); t.nav.progress`. */
export function useTranslations(): Dictionary {
  return useLocaleContext().t;
}

/** Client Component hook returning just the active locale code ("lt" |
 * "en") — useful for locale-aware formatting (`formatDate`, `pluralize`,
 * etc.) alongside `useTranslations()`. */
export function useLocale(): Locale {
  return useLocaleContext().locale;
}
