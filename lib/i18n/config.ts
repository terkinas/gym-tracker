// Central i18n configuration. Everything else in `lib/i18n` and the rest of
// the app should import the supported-locale list and cookie name from
// here rather than re-declaring them, so adding a language later is a
// one-file change.

export const SUPPORTED_LOCALES = ["lt", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Lithuanian is the app's original language and stays the default for
 * anyone who hasn't explicitly chosen English. */
export const DEFAULT_LOCALE: Locale = "lt";

/** Persists the user's language choice across page refreshes, route
 * navigation, and browser restarts. This is a UI preference, not
 * application data — never store it alongside workout/exercise JSON. */
export const LOCALE_COOKIE_NAME = "gymtracker-language";

// One year — a language preference is meant to stick around indefinitely,
// not expire like a session.
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Narrows an arbitrary string (e.g. a raw cookie value) to a supported
 * `Locale`, falling back to `false` for anything else — including an
 * empty/missing cookie. Callers should fall back to `DEFAULT_LOCALE`. */
export function isLocale(value: string | undefined | null): value is Locale {
  if (!value) return false;
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
