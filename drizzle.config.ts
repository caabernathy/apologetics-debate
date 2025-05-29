import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DB_URL || "file:local.db",
    authToken: process.env.TURSO_DB_AUTH_TOKEN || "",
  },
});
