import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../src/lib/db/schema.js";

async function initDatabase() {
  console.log("Initializing database...");

  try {
    const client = createClient({
      url: process.env.TURSO_DB_URL || "file:local.db",
      authToken: process.env.TURSO_DB_AUTH_TOKEN || "",
    });

    const db = drizzle(client, { schema });

    await client.execute(`
      CREATE TABLE IF NOT EXISTS debate_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        is_user_apologist INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS debate_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        content TEXT NOT NULL,
        sender_type TEXT NOT NULL CHECK (sender_type IN ('USER', 'AI', 'EXPERT')),
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES debate_sessions(id)
      );
    `);

    console.log("✅ Database tables created successfully!");

    // Check if tables exist and have expected structure
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
