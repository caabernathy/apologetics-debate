import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../src/lib/db/schema";

async function initDatabase() {
  console.log("Initializing database...");

  try {
    const client = createClient({
      url: process.env.TURSO_DB_URL || "file:local.db",
      authToken: process.env.TURSO_DB_AUTH_TOKEN || "",
    });

    const db = drizzle(client, { schema });

    console.log("Applying migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Database migrations applied successfully!");

    // After migration, you can check all tables, including Better Auth's
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table';",
    );
    console.log(
      "📋 Available tables:",
      tables.rows.map((row) => row.name),
    );

    client.close();
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}

export { initDatabase };
