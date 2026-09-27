import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, decryptSession } from "@/lib/auth/session";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behavior). It now
// defaults to the Node.js runtime, which is what lets us verify the JWT with
// `jose` here directly instead of only checking whether a cookie exists.

// NOTE: the phase 3.1 instructions list `/progresas`, but this codebase's
// actual routes are `/`, `/pratimai`, `/progress` and (as of phase 3.2)
// `/treniruote` — those are the ones protected below.
const PROTECTED_PATHS = ["/", "/pratimai", "/progress", "/treniruote"];
const AUTH_ONLY_PATHS = ["/login", "/register"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decryptSession(token);
  const isAuthenticated = session !== null;

  if (matchesPath(pathname, PROTECTED_PATHS) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (matchesPath(pathname, AUTH_ONLY_PATHS) && isAuthenticated) {
    return NextResponse.redirect(new URL("/treniruote", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
