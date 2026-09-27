import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Next.js automatically loads .env.local (and .env, .env.production, etc.)
// for app code; drizzle-kit is a standalone CLI and doesn't, so the same
// load order is replicated here via @next/env — the loader Next.js uses
// internally and documents for exactly this "ORM config file" case.
loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL aplinkos kintamasis nenustatytas. Nustatykite jį .env.local faile prieš paleisdami drizzle-kit komandas.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
