import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/endocrine_survey";
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
