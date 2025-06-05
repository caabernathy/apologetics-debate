import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const debateSessions = sqliteTable("debate_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  isUserApologist: integer("is_user_apologist", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const debateMessages = sqliteTable("debate_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => debateSessions.id),
  content: text("content").notNull(),
  senderType: text("sender_type", { enum: ["USER", "AI", "EXPERT"] }).notNull(),
  createdAt: text("created_at").notNull(),
});

export type DebateSession = typeof debateSessions.$inferSelect;
export type DebateMessage = typeof debateMessages.$inferSelect;
