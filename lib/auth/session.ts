import "server-only";

import { SignJWT, jwtVerify } from "jose";

// Passport's own session support (`serializeUser`/`deserializeUser`) is
// built around `express-session` and a long-lived server process — it has
// nothing to plug into here. Instead we keep our own session as a signed,
// HTTP-only JWT cookie, which is the pattern Next.js' own auth guide
// recommends for the App Router (see the `jose` / Session Management
// Libraries section of the Next.js authentication docs).

export const SESSION_COOKIE_NAME = "gymtracker_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dienos

// Single source of truth for the session cookie's attributes. Login (set),
// logout (delete) and the proxy (clearing a stale cookie) ALL derive their
// options from here, so name/path/sameSite/secure can never drift apart —
// a browser only removes a cookie when the deleting Set-Cookie matches the
// name + path (+ domain) of the one that was stored.
//
// - `secure` is on only in production (HTTPS); on localhost over plain HTTP
//   a Secure cookie would be silently dropped by the browser and break login.
// - `domain` is intentionally NOT set: the cookie is host-only. If a domain
//   is ever needed, add it here (and only here) so login and logout agree.
const SESSION_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

/** Options for creating the session cookie at login/registration. */
export function sessionCookieOptions() {
  return { ...SESSION_COOKIE_BASE_OPTIONS, maxAge: SESSION_DURATION_SECONDS };
}

/** Options for deleting the session cookie: identical attributes as the
 * login cookie, but already expired. Used with `set(name, "", ...)` so the
 * SAME cookie is overwritten/removed instead of creating a second one. */
export function expiredSessionCookieOptions() {
  return { ...SESSION_COOKIE_BASE_OPTIONS, maxAge: 0, expires: new Date(0) };
}

const secret = process.env.SESSION_SECRET;

if (!secret && process.env.NODE_ENV === "production") {
  throw new Error(
    "SESSION_SECRET aplinkos kintamasis nenustatytas. Nustatykite jį prieš paleisdami production build.",
  );
}

// Falls back to a fixed dev-only value so `npm run dev` works out of the box
// without a .env.local file. Never reaches this branch in production, see
// the check above.
const encodedSecret = new TextEncoder().encode(
  secret ?? "dev-only-insecure-secret-do-not-use-in-production",
);

export type SessionPayload = {
  userId: string;
};

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(encodedSecret);
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });

    if (typeof payload.userId !== "string") return null;

    return { userId: payload.userId };
  } catch {
    // Expired, tampered with, or signed with a different secret.
    return null;
  }
}
