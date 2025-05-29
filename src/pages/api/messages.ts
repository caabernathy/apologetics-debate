import type { APIRoute } from "astro";
import { db, generateId } from "../../lib/db/client";
import { debateMessages } from "../../lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query the database for messages
    const messages = await db
      .select()
      .from(debateMessages)
      .where(eq(debateMessages.sessionId, sessionId))
      .orderBy(asc(debateMessages.createdAt));

    return new Response(JSON.stringify(messages), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch messages" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      sessionId,
      content,
      senderType,
      isExpertResponse = false,
    } = await request.json();

    if (!sessionId || !content || !senderType) {
      return new Response(
        JSON.stringify({
          error: "Session ID, content, and sender type are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate senderType
    const validSenderTypes = ["USER", "AI", "EXPERT"];
    if (!validSenderTypes.includes(senderType)) {
      return new Response(
        JSON.stringify({
          error: "Invalid sender type. Must be USER, AI, or EXPERT",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Save message to database
    const savedMessage = await db
      .insert(debateMessages)
      .values({
        id: generateId("msg"),
        sessionId,
        content,
        senderType,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return new Response(JSON.stringify(savedMessage[0]), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating message:", error);

    let errorMessage = "Failed to create message";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("UNIQUE constraint")) {
        errorMessage = "Message already exists";
        statusCode = 409;
      } else if (error.message.includes("NOT NULL constraint")) {
        errorMessage = "Missing required fields";
        statusCode = 400;
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};
