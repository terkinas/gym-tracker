// Locale-aware presentation helpers. These only ever format already-loaded
// data for display — none of them touch how dates/numbers are stored
// (`lib/date.ts` and the JSON files are untouched) or how they're computed
// (`lib/progress/analytics.ts`'s math is locale-independent).

import type { Locale } from "@/lib/i18n/config";
import { formatLithuanianDate } from "@/lib/date";

const INTL_LOCALE: Record<Locale, string> = {
  lt: "lt-LT",
  en: "en-US",
};

/** Renders a `YYYY-MM-DD` string as a long, locale-appropriate date, e.g.
 * "2026 m. rugsėjo 26 d." (lt) or "September 26, 2026" (en). The stored
 * `YYYY-MM-DD` format itself never changes — this is presentation only. */
export function formatDate(dateString: string, locale: Locale): string {
  if (locale === "lt") return formatLithuanianDate(dateString);

  const date = new Date(`${dateString}T00:00:00Z`);
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Compact axis-label date, e.g. "26.9" (lt) or "9/26" (en) for 2026-09-26 —
 * a full long date is too wide for a chart axis. */
export function formatShortDate(dateString: string, locale: Locale): string {
  if (locale === "lt") {
    const [, month, day] = dateString.split("-");
    return `${Number(day)}.${Number(month)}`;
  }

  const date = new Date(`${dateString}T00:00:00Z`);
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatCount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

export function formatVolume(value: number, locale: Locale): string {
  return `${new Intl.NumberFormat(INTL_LOCALE[locale]).format(Math.round(value))} kg`;
}

export function formatCompactNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { notation: "compact" }).format(value);
}

/** Picks the grammatically correct form for a count, given a
 * `[singular, plural]` word-forms tuple from the translation dictionary.
 *
 * Lithuanian pluralization is irregular — e.g. 1, 21, 31... take the
 * singular, 11–19 always take the plural even though they end in "1", and
 * everything else takes the plural. English just needs singular for
 * exactly 1 and plural otherwise. */
export function pluralize(
  locale: Locale,
  count: number,
  forms: readonly [string, string],
): string {
  const [singular, plural] = forms;

  if (locale === "lt") {
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 19) return plural;
    return count % 10 === 1 ? singular : plural;
  }

  return count === 1 ? singular : plural;
}
