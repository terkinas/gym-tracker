"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "@/lib/i18n/config";

/** Persists the chosen language and re-renders the current route in the new
 * language. Called from the language switcher — a Client Component action,
 * not a form submission, so it never navigates away from the current page,
 * logs the user out, or touches workout/exercise state. */
export async function setLocaleAction(locale: Locale): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });

  // The root layout reads the locale cookie once per request; revalidating
  // from the layout down ensures every Server Component (nav labels, page
  // titles, server-rendered dates, etc.) picks up the new language without
  // a full navigation.
  revalidatePath("/", "layout");
}
