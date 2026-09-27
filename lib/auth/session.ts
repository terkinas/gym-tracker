import { SignJWT, jwtVerify } from "jose";

// Passport's own session support (`serializeUser`/`deserializeUser`) is
// built around `express-session` and a long-lived server process — it has
// nothing to plug into here. Instead we keep our own session as a signed,
// HTTP-only JWT cookie, which is the pattern Next.js' own auth guide
// recommends for the App Router (see the `jose` / Session Management
// Libraries section of the Next.js authentication docs).

export const SESSION_COOKIE_NAME = "gymtracker_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dienos

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
