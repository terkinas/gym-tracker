import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, decryptSession } from "@/lib/auth/session";
import { getUserProfileById } from "@/lib/storage/users";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
};

const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decryptSession(token);
});

// `cache()` de-dupes this within a single request/render pass, so a page and
// its layout can both call getCurrentUser() without reading the cookie twice.
//
// Authentication comes from the signed, expiring session cookie alone — no
// database round trip. Cookies issued before name/username were embedded in
// the token only carry `userId`; for those we fall back to one lookup (and a
// deleted user is rejected there).
//
// This does NOT re-check that the user row still exists. Authorization never
// depends on that: every query and write is scoped by `user.id` (and the FKs
// reject writes for a missing user). Where a page needs the check it gets it
// for free from a read it already makes (see app/treniruote/page.tsx), and
// /login and /register use getVerifiedUser() below.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  if (session.name !== undefined && session.username !== undefined) {
    return { id: session.userId, name: session.name, username: session.username };
  }

  // Legacy cookie (userId only).
  return getUserProfileById(session.userId);
});

/** Like getCurrentUser, but always confirms the user row still exists. Used
 * where trusting the cookie alone would be wrong: /login and /register
 * redirect signed-in users away, and must not bounce a deleted user between
 * a protected page and /login. */
export const getVerifiedUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;
  return getUserProfileById(session.userId);
});

/** Throws if there's no authenticated user. Use in Server Actions / data
 * loaders that must never run on behalf of an anonymous request — never
 * trust a userId passed in from the client instead. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}
