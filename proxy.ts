import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  decryptSession,
  expiredSessionCookieOptions,
} from "@/lib/auth/session";
import { userExists } from "@/lib/storage/users";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behavior). It now
// defaults to the Node.js runtime, which is what lets us verify the JWT with
// `jose` here directly instead of only checking whether a cookie exists.

// NOTE: the phase 3.1 instructions list `/progresas`, but this codebase's
// actual routes are `/`, `/pratimai`, `/progress` and (as of phase 3.2)
// `/treniruote` — those are the ones protected below.
const PROTECTED_PATHS = ["/", "/pratimai", "/progress", "/treniruote", "/istorija", "/rekordai", "/leaderboard"];
const AUTH_ONLY_PATHS = ["/login", "/register"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

// A JWT can be perfectly valid (signature + expiry) while the user it names
// no longer exists (e.g. DB reset / data migration). Such a session cannot be
// validated either, so it must count as unauthenticated — otherwise /login
// would bounce to /treniruote forever with no way to log in again.
// If the lookup itself fails (DB outage) we do NOT treat the session as
// invalid, so a temporary outage never wipes everyone's cookies.
async function sessionUserStillExists(userId: string): Promise<boolean> {
  try {
    return await userExists(userId);
  } catch {
    console.error("[auth] user lookup failed in proxy; keeping session as-is");
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);
  const isAuthenticated =
    session !== null && (await sessionUserStillExists(session.userId));

  // Clear a stale cookie only on plain page navigations (GET/HEAD). Server
  // Actions are POSTs: login sets a fresh cookie there, and a deletion header
  // from the proxy must never compete with it.
  const shouldClearCookie =
    token !== undefined &&
    !isAuthenticated &&
    (request.method === "GET" || request.method === "HEAD");

  const finalize = (response: NextResponse) => {
    if (shouldClearCookie) {
      response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
    }
    return response;
  };

  if (matchesPath(pathname, PROTECTED_PATHS) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return finalize(NextResponse.redirect(loginUrl));
  }

  if (matchesPath(pathname, AUTH_ONLY_PATHS) && isAuthenticated) {
    return NextResponse.redirect(new URL("/treniruote", request.url));
  }

  return finalize(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
