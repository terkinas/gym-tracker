// Body weight tracking helpers. Shared by the workout UI, the save action and
// (later) analytics, so the rules live in exactly one place.

/** Accepted body weight range, in kg. */
export const BODY_WEIGHT_MIN = 20;
export const BODY_WEIGHT_MAX = 300;

/** True for a finite body weight within range, with at most one decimal
 * place (e.g. 82 or 82.5, but not 82.55). */
export function isValidBodyWeight(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (value < BODY_WEIGHT_MIN || value > BODY_WEIGHT_MAX) return false;
  const tenths = value * 10;
  return Math.abs(tenths - Math.round(tenths)) < 1e-6;
}

/** Parses the body weight text field. "" → `{ ok: true, value: null }` (the
 * field is optional). Accepts "," or "." as the decimal separator. */
export function parseBodyWeightInput(
  raw: string,
): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return { ok: true, value: null };
  if (!/^\d+(\.\d)?$/.test(trimmed)) return { ok: false };
  const value = Number(trimmed);
  return isValidBodyWeight(value) ? { ok: true, value } : { ok: false };
}

/** Total load moved by one set:
 *   bodyweight exercise      → body weight + additional (external) weight
 *   any other exercise       → additional weight
 * Returns `null` for a bodyweight exercise when the workout has no body
 * weight recorded, because the real load is then unknown (callers decide
 * whether to skip the set or fall back to the additional weight).
 *
 * NOT used by the existing PR / progress / leaderboard calculations yet —
 * those still work on the entered weight only. */
export function effectiveLoad(input: {
  additionalWeight: number;
  usesBodyweight: boolean;
  bodyWeight: number | null;
}): number | null {
  if (!input.usesBodyweight) return input.additionalWeight;
  if (input.bodyWeight === null) return null;
  return input.bodyWeight + input.additionalWeight;
}
