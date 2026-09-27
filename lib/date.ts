// GymTracker is a single-locale (Lithuanian) app, so "today" is anchored to
// a fixed timezone rather than the server process's local timezone — a
// server running in UTC (common on hosting platforms) would otherwise flip
// the workout's date several hours before/after local midnight in Lithuania.
const APP_TIME_ZONE = "Europe/Vilnius";

const LITHUANIAN_MONTHS_GENITIVE = [
  "sausio",
  "vasario",
  "kovo",
  "balandžio",
  "gegužės",
  "birželio",
  "liepos",
  "rugpjūčio",
  "rugsėjo",
  "spalio",
  "lapkričio",
  "gruodžio",
] as const;

/** Formats a `Date` as a stable `YYYY-MM-DD` string in the app's timezone. */
export function formatDateInAppTimeZone(date: Date): string {
  // en-CA's date formatting happens to be YYYY-MM-DD, which is convenient,
  // but we still assemble the parts ourselves rather than trust that so this
  // never silently breaks if formatting behavior changes.
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

/** Today's date, as `YYYY-MM-DD`, in the app's timezone. This is the only
 * place a workout's date should ever come from server-side — never trust a
 * date supplied by the client. */
export function getTodayDateString(): string {
  return formatDateInAppTimeZone(new Date());
}

/** Renders a `YYYY-MM-DD` string as a Lithuanian long date, e.g.
 * "2026 m. rugsėjo 26 d." */
export function formatLithuanianDate(dateString: string): string {
  const [yearStr, monthStr, dayStr] = dateString.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const monthName = LITHUANIAN_MONTHS_GENITIVE[month - 1] ?? "";

  return `${year} m. ${monthName} ${day} d.`;
}
