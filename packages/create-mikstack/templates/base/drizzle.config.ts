import { defineConfig } from "drizzle-kit";
// {{#if:needsEnvLoad}}
import { existsSync } from "node:fs";

if (existsSync(".env")) {
  process.loadEnvFile();
}
// {{/if:needsEnvLoad}}

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://placeholder";

export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: DATABASE_URL },
  verbose: true,
  strict: true,
  casing: "snake_case",
});
