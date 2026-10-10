"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { verifyCredentials } from "@/lib/auth/passport";
import {
  SESSION_COOKIE_NAME,
  encryptSession,
  expiredSessionCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { createUser, getUserByUsername } from "@/lib/storage/users";

export type AuthFormState = { error: string } | undefined;

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
// Letters (incl. accented/Lithuanian), numbers, dots, underscores and
// hyphens — deliberately permissive about accented characters since names
// like "Šarūnas" are common, but still excludes whitespace and punctuation
// that would make a username awkward to type or display.
const USERNAME_PATTERN = /^[\p{L}\p{N}._-]+$/u;
const PASSWORD_HASH_ROUNDS = 12;

function isValidUsername(username: string): boolean {
  return (
    username.length >= USERNAME_MIN_LENGTH &&
    username.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(username)
  );
}

async function startSession(user: { id: string; name: string; username: string }) {
  // name/username are embedded so later requests can authenticate from the
  // signed cookie alone (no per-request user lookup).
  const token = await encryptSession({
    userId: user.id,
    name: user.name,
    username: user.username,
  });
  const cookieStore = await cookies();

  // Same name + attributes as the logout/clear options, so this always
  // REPLACES any previous (possibly stale) gymtracker_session instead of
  // living next to it.
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name) {
    return { error: "NAME_REQUIRED" };
  }
  if (!username || !isValidUsername(username)) {
    return { error: "INVALID_USERNAME" };
  }
  if (password.length < 8) {
    return { error: "PASSWORD_TOO_SHORT" };
  }
  if (password !== confirmPassword) {
    return { error: "PASSWORDS_DO_NOT_MATCH" };
  }

  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    return { error: "USERNAME_TAKEN" };
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  let createdUser: { id: string; name: string; username: string };
  try {
    createdUser = await createUser({ name, username, passwordHash });
  } catch {
    // Covers the race where two requests register the same username at
    // once — createUser re-checks and throws USERNAME_TAKEN.
    return { error: "USERNAME_TAKEN" };
  }

  await startSession(createdUser);
  redirect("/");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "USERNAME_PASSWORD_REQUIRED" };
  }

  const result = await verifyCredentials(username, password);
  if (!result.success) {
    return { error: result.message };
  }

  await startSession(result.user);
  redirect("/treniruote");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  // Overwrite with an already-expired cookie that has exactly the same
  // attributes as the login cookie (see lib/auth/session.ts).
  cookieStore.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
  redirect("/login");
}
