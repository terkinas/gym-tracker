import "server-only";

import { PrismaClient } from "@prisma/client";

// Standard Next.js Prisma singleton: in development, `next dev`'s hot
// reload re-evaluates this module on every edit, which would otherwise
// create a new PrismaClient (and a new pool of DB connections) each time.
// Stashing the instance on `globalThis` — which survives module reloads,
// unlike a plain module-level variable — means dev keeps reusing the same
// client. In production there's only ever one module evaluation, so this
// is a no-op there beyond the initial assignment.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
