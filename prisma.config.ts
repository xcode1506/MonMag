import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

// Real credentials live only in git-ignored `.env.local`.
// Resolve from this file so the CLI works from any working directory.
loadEnv({
  path: fileURLToPath(new URL("./.env.local", import.meta.url)),
  quiet: true,
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
