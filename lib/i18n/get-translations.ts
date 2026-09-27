import "server-only";

import { getLocale } from "@/lib/i18n/get-locale";
import { translations } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/translations";

export type ServerTranslations = { locale: Locale; t: Dictionary };

/** For Server Components / Server Actions: resolves the current locale from
 * the request's cookies and returns it alongside that locale's translation
 * dictionary — e.g. `const { t, locale } = await getTranslations()` then
 * `t.workout.pageTitle`. */
export async function getTranslations(): Promise<ServerTranslations> {
  const locale = await getLocale();
  return { locale, t: translations[locale] };
}
