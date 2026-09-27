import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale, type Locale } from "@/lib/i18n/config";

/** Reads the user's chosen language from the `gymtracker-language` cookie
 * for the current request, falling back to `DEFAULT_LOCALE` when the
 * cookie is missing or holds an unrecognized value. Server Components use
 * this (directly or via `getTranslations()`) so they render the right
 * language on the very first response, before any client JS runs. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
