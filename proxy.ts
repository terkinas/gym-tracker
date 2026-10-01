import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  decryptSession,
  expiredSessionCookieOptions,
} from "@/lib/auth/session";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behavior). It now
// defaults to the Node.js runtime, which is what lets us verify the JWT with
// `jose` here directly instead of only checking whether a cookie exists.

// NOTE: the phase 3.1 instructions list `/progresas`, but this codebase's
// actual routes are `/`, `/pratimai`, `/progress` and (as of phase 3.2)
// `/treniruote` — those are the ones protected below.
const PROTECTED_PATHS = ["/", "/pratimai", "/progress", "/treniruote", "/istorija", "/rekordai", "/leaderboard"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

// NOTE: the proxy must stay free of Prisma (Netlify rejects native C++ addons
// in Middleware). It only verifies the JWT; "does this user still exist" is
// checked in Node.js server code (see getCurrentUser in lib/auth/dal.ts and
// the /login, /register and protected pages).

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);
  const isAuthenticated = session !== null;

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

  // Logged-in users hitting /login or /register are redirected by those pages
  // themselves (they can verify the user still exists; the proxy cannot).

  return finalize(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
