import "server-only";

import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient for the whole app. Every storage helper
// (lib/storage/*) imports `db` from here — nothing else in the app
// constructs a PrismaClient, calls `$disconnect()` or `$connect()`.
//
// The instance is cached on `globalThis` in EVERY environment, not just
// development:
//  - dev: `next dev` hot reload re-evaluates this module on each edit, which
//    would otherwise create a new client (and a new connection pool) per edit;
//  - production / serverless: a warm Netlify function container reuses the
//    same client across invocations, and if the bundler ever evaluates this
//    module twice inside one runtime (e.g. separate route/server-action
//    chunks) both copies still share one client and one pool.
// After a cold start the module simply runs again and creates a fresh client,
// so nothing relies on a long-lived Node process.
//
// Prisma manages its own connection pool and transparently replaces pooled
// connections the database/pooler has closed, so there is deliberately no
// per-request disconnect/reconnect logic here.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInstanceCount: number | undefined;
};

function createClient(): PrismaClient {
  // Opt-in diagnostics (set PRISMA_DEBUG=1): shows how many clients this
  // runtime creates. Never logs connection strings or any other secret.
  if (process.env.PRISMA_DEBUG === "1") {
    globalForPrisma.prismaInstanceCount = (globalForPrisma.prismaInstanceCount ?? 0) + 1;
    console.info(
      `[prisma] PrismaClient created (instance #${globalForPrisma.prismaInstanceCount}, pid ${process.pid})`,
    );
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

globalForPrisma.prisma = db;
