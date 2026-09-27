import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, decryptSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/storage/users";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
};

// `cache()` de-dupes this within a single request/render pass, so a page and
// its layout can both call getCurrentUser() without reading the cookie or
// hitting the JSON file twice.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);

  if (!session) return null;

  const user = await getUserById(session.userId);
  if (!user) return null;

  return { id: user.id, name: user.name, username: user.username };
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
