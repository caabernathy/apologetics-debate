import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { database } from "../config";

const client = createClient({
  url: database.url,
  authToken: database.token,
});

export const db = drizzle(client, { schema });

// Utility function to generate unique IDs
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  const id = `${timestamp}-${random}`;
  return prefix ? `${prefix}-${id}` : id;
}
