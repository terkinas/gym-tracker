import "server-only";

import passport from "passport";
import { Strategy as LocalStrategy, type VerifyFunction } from "passport-local";
import bcrypt from "bcryptjs";

import { getUserByUsername } from "@/lib/storage/users";

// Passport is built around Express' req/res/next lifecycle: normally
// `passport.authenticate('local')` reads `req.body`, and a successful check
// calls `req.login()` to write into an `express-session`-backed session.
// Next.js Route Handlers and Server Actions don't have an Express req/res or
// a persistent server-side session store, so that machinery has nothing to
// attach to here.
//
// We still use passport-local's `LocalStrategy` to define the verification
// logic, as requested, and register it with `passport.use()` so it's a real
// passport strategy. We just call its verify callback directly instead of
// running it through `passport.authenticate()`, and we manage the session
// ourselves with a signed JWT cookie (see `lib/auth/session.ts`) rather than
// passport's session serialization.

type PublicUser = { id: string; name: string; username: string };

const verify: VerifyFunction = async (username, password, done) => {
  try {
    const user = await getUserByUsername(username);

    if (!user) {
      done(null, false, { message: "INVALID_CREDENTIALS" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      done(null, false, { message: "INVALID_CREDENTIALS" });
      return;
    }

    done(null, { id: user.id, name: user.name, username: user.username });
  } catch (error) {
    done(error as Error);
  }
};

// `usernameField` here is passport-local's own option name for "the form
// field this strategy treats as the login identifier" — it is set to
// "username" both because that's passport-local's default and because it
// now matches the actual field we authenticate with.
passport.use(new LocalStrategy({ usernameField: "username" }, verify));

export type VerifyCredentialsResult =
  | { success: true; user: PublicUser }
  | { success: false; message: string };

export function verifyCredentials(
  username: string,
  password: string,
): Promise<VerifyCredentialsResult> {
  return new Promise((resolve) => {
    verify(username, password, (error, user, info) => {
      if (error) {
        resolve({ success: false, message: "GENERIC" });
        return;
      }

      if (!user || user === false) {
        const message =
          (info as { message?: string } | undefined)?.message ?? "INVALID_CREDENTIALS";
        resolve({ success: false, message });
        return;
      }

      resolve({ success: true, user: user as PublicUser });
    });
  });
}

export default passport;
