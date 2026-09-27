import "server-only";

import { db } from "@/lib/db";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

// Duck-typed check for Prisma's unique-constraint error instead of
// `instanceof Prisma.PrismaClientKnownRequestError` — avoids depending on
// the `Prisma` namespace export (a runtime value, not just a type) purely
// for a single error-code check.
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === UNIQUE_CONSTRAINT_VIOLATION
  );
}

export type User = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

function toUser(row: {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const normalized = username.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { username: normalized } });
  return user ? toUser(user) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { id } });
  return user ? toUser(user) : null;
}

export async function createUser(data: {
  name: string;
  username: string;
  passwordHash: string;
}): Promise<User> {
  const normalizedUsername = data.username.trim().toLowerCase();

  try {
    const user = await db.user.create({
      data: {
        name: data.name.trim(),
        username: normalizedUsername,
        passwordHash: data.passwordHash,
      },
    });
    return toUser(user);
  } catch (error) {
    // Mirrors the previous JSON-backed behavior: a duplicate username throws
    // the same USERNAME_TAKEN error the caller (registerAction) already
    // expects, whether it's caught here via a pre-check or, as with a real
    // database, via the unique constraint itself (which also closes the
    // race between two concurrent registrations with the same username that
    // a plain "check then write" can't fully close).
    if (isUniqueConstraintError(error)) {
      throw new Error("USERNAME_TAKEN");
    }
    throw error;
  }
}
